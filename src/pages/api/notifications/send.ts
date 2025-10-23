import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { matchKeywords } from '@/utils/keywordMatcher';
import {
  sendPushNotificationBatch,
  createKeywordNotificationPayload
} from '@/utils/pushSender';

// Supabase Admin 클라이언트 (서비스 역할 키 사용)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface NewsItem {
  id: number;
  title: string;
  description?: string;
  original_link: string;
  category: string;
  media_name?: string;
}

interface SendNotificationRequest {
  news: NewsItem | NewsItem[];
  apiKey?: string; // 보안을 위한 API 키 (선택)
}

interface SendNotificationResponse {
  success: boolean;
  sent: number;
  failed: number;
  details?: Array<{
    device_id: string;
    success: boolean;
    error?: string;
  }>;
  message?: string;
}

/**
 * 푸시 알림 전송 API (키워드 전용)
 *
 * POST /api/notifications/send
 *
 * 새로운 뉴스가 추가될 때 키워드 기반으로
 * 사용자들에게 푸시 알림을 전송합니다.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SendNotificationResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      sent: 0,
      failed: 0,
      message: `Method ${req.method} Not Allowed`
    });
  }

  try {
    const { news, apiKey }: SendNotificationRequest = req.body;

    // API 키 검증 (선택사항 - 보안 강화)
    const expectedApiKey = process.env.NOTIFICATION_API_KEY;
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return res.status(401).json({
        success: false,
        sent: 0,
        failed: 0,
        message: 'Unauthorized: Invalid API key'
      });
    }

    // 뉴스 데이터 검증
    if (!news) {
      return res.status(400).json({
        success: false,
        sent: 0,
        failed: 0,
        message: 'News data is required'
      });
    }

    // 단일 뉴스를 배열로 변환
    const newsList = Array.isArray(news) ? news : [news];

    let totalSent = 0;
    let totalFailed = 0;
    const allDetails: Array<{
      device_id: string;
      success: boolean;
      error?: string;
    }> = [];

    // 각 뉴스에 대해 키워드 기반 알림 전송
    for (const newsItem of newsList) {
      const result = await sendKeywordNotifications(newsItem);
      totalSent += result.sent;
      totalFailed += result.failed;
      allDetails.push(...result.details);
    }

    return res.status(200).json({
      success: true,
      sent: totalSent,
      failed: totalFailed,
      details: allDetails,
      message: `Sent ${totalSent} notifications, ${totalFailed} failed`
    });
  } catch (error) {
    console.error('Notification send error:', error);
    return res.status(500).json({
      success: false,
      sent: 0,
      failed: 0,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * 키워드 기반 알림 전송
 */
async function sendKeywordNotifications(newsItem: NewsItem) {
  let sent = 0;
  let failed = 0;
  const details: Array<{ device_id: string; success: boolean; error?: string }> = [];

  try {
    console.log('[알림 전송] 뉴스:', newsItem.title);

    // 활성화된 구독자 조회 (새 테이블 구조)
    const { data: subscribers, error } = await supabaseAdmin
      .from('keyword_push_subscriptions')
      .select('device_id, endpoint, p256dh_key, auth_key, keywords, schedule_enabled, schedule_start, schedule_end')
      .eq('enabled', true);

    if (error) {
      console.error('구독자 조회 오류:', error);
      return { sent, failed, details };
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('[알림 전송] 활성 구독자 없음');
      return { sent, failed, details };
    }

    console.log(`[알림 전송] 총 ${subscribers.length}명의 활성 구독자 확인`);

    // 현재 시간 확인 (KST)
    const now = new Date();
    const kstOffset = 9 * 60; // KST = UTC+9
    const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
    const currentHour = kstTime.getUTCHours();
    const currentMinute = kstTime.getUTCMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // 키워드 매칭 및 시간대 필터링
    const matchedUsers: Array<{
      device_id: string;
      subscription: PushSubscriptionJSON;
      matchedKeywords: string[];
    }> = [];

    for (const user of subscribers) {
      // 시간대 체크
      if (user.schedule_enabled) {
        const [startHour, startMinute] = user.schedule_start.split(':').map(Number);
        const [endHour, endMinute] = user.schedule_end.split(':').map(Number);
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;

        if (currentTimeMinutes < startTimeMinutes || currentTimeMinutes > endTimeMinutes) {
          console.log(`[알림 전송] ${user.device_id}: 시간대 제외 (${currentHour}:${currentMinute})`);
          continue;
        }
      }

      // 키워드 매칭
      if (!user.keywords || user.keywords.length === 0) {
        console.log(`[알림 전송] ${user.device_id}: 키워드 없음`);
        continue;
      }

      const matchResult = matchKeywords(
        {
          title: newsItem.title,
          description: newsItem.description || ''
        },
        user.keywords
      );

      if (matchResult.matched) {
        // Subscription 객체 재구성
        const subscription: PushSubscriptionJSON = {
          endpoint: user.endpoint,
          keys: {
            p256dh: user.p256dh_key,
            auth: user.auth_key
          }
        };

        matchedUsers.push({
          device_id: user.device_id,
          subscription,
          matchedKeywords: matchResult.matchedKeywords
        });

        console.log(`[알림 전송] ${user.device_id}: 매칭됨 (키워드: ${matchResult.matchedKeywords.join(', ')})`);
      }
    }

    console.log(`[알림 전송] 매칭된 사용자: ${matchedUsers.length}명`);

    // 매칭된 사용자에게 알림 전송
    if (matchedUsers.length > 0) {
      const subscriptions = matchedUsers.map(user => ({
        device_id: user.device_id,
        subscription: user.subscription
      }));

      // 각 사용자별로 매칭된 키워드로 페이로드 생성
      const payload = createKeywordNotificationPayload(
        newsItem.title,
        matchedUsers[0].matchedKeywords,
        newsItem.original_link,
        newsItem.media_name
      );

      const results = await sendPushNotificationBatch(subscriptions, payload);

      for (const result of results) {
        if (result.result.success) {
          sent++;
          console.log(`[알림 전송] ${result.device_id}: 성공`);
        } else {
          failed++;
          console.error(`[알림 전송] ${result.device_id}: 실패 -`, result.result.error);

          // 만료된 구독 정리 (410 Gone)
          if (result.result.statusCode === 410) {
            console.log(`[알림 전송] ${result.device_id}: 만료된 구독 삭제`);
            await supabaseAdmin
              .from('keyword_push_subscriptions')
              .delete()
              .eq('device_id', result.device_id);
          }
        }

        details.push({
          device_id: result.device_id,
          success: result.result.success,
          error: result.result.error
        });
      }
    }
  } catch (error) {
    console.error('키워드 알림 전송 오류:', error);
  }

  console.log(`[알림 전송] 완료 - 성공: ${sent}, 실패: ${failed}`);
  return { sent, failed, details };
}
