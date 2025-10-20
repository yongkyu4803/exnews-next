import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { matchKeywords } from '@/utils/keywordMatcher';
import {
  sendPushNotificationBatch,
  createKeywordNotificationPayload,
  createCategoryNotificationPayload,
  cleanupExpiredSubscription
} from '@/utils/pushSender';

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
  mode?: 'keyword' | 'category' | 'both';
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
 * 푸시 알림 전송 API
 *
 * POST /api/notifications/send
 *
 * 새로운 뉴스가 추가될 때 키워드 또는 카테고리 기반으로
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
    const { news, mode = 'both', apiKey }: SendNotificationRequest = req.body;

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

    // 각 뉴스에 대해 알림 전송
    for (const newsItem of newsList) {
      // 1. 키워드 기반 알림 전송
      if (mode === 'keyword' || mode === 'both') {
        const keywordResult = await sendKeywordNotifications(newsItem);
        totalSent += keywordResult.sent;
        totalFailed += keywordResult.failed;
        allDetails.push(...keywordResult.details);
      }

      // 2. 카테고리 기반 알림 전송
      if (mode === 'category' || mode === 'both') {
        const categoryResult = await sendCategoryNotifications(newsItem);
        totalSent += categoryResult.sent;
        totalFailed += categoryResult.failed;
        allDetails.push(...categoryResult.details);
      }
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
    // 키워드 알림 모드 사용자 조회
    const { data: users, error } = await supabase
      .from('user_notification_settings')
      .select('device_id, push_subscription, keywords')
      .eq('enabled', true)
      .not('keywords', 'is', null)
      .neq('keywords', '{}'); // 빈 배열이 아닌 경우

    if (error) {
      console.error('Error fetching keyword users:', error);
      return { sent, failed, details };
    }

    if (!users || users.length === 0) {
      return { sent, failed, details };
    }

    // 각 사용자의 키워드와 뉴스 매칭
    const matchedUsers: Array<{
      device_id: string;
      subscription: PushSubscriptionJSON;
      matchedKeywords: string[];
    }> = [];

    for (const user of users) {
      if (!user.keywords || user.keywords.length === 0) continue;
      if (!user.push_subscription) continue;

      const matchResult = matchKeywords(
        {
          title: newsItem.title,
          description: newsItem.description || ''
        },
        user.keywords
      );

      if (matchResult.matched) {
        matchedUsers.push({
          device_id: user.device_id,
          subscription: user.push_subscription,
          matchedKeywords: matchResult.matchedKeywords
        });
      }
    }

    // 매칭된 사용자에게 알림 전송
    if (matchedUsers.length > 0) {
      const subscriptions = matchedUsers.map(user => ({
        device_id: user.device_id,
        subscription: user.subscription
      }));

      // 첫 번째 사용자의 매칭 키워드로 페이로드 생성 (모든 사용자에게 동일한 알림)
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
        } else {
          failed++;

          // 만료된 구독 정리
          if (result.result.statusCode === 410) {
            await cleanupExpiredSubscription(result.device_id);
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
    console.error('Keyword notification error:', error);
  }

  return { sent, failed, details };
}

/**
 * 카테고리 기반 알림 전송
 */
async function sendCategoryNotifications(newsItem: NewsItem) {
  let sent = 0;
  let failed = 0;
  const details: Array<{ device_id: string; success: boolean; error?: string }> = [];

  try {
    // 카테고리 알림 모드 사용자 조회
    const { data: users, error } = await supabase
      .from('user_notification_settings')
      .select('device_id, push_subscription, categories, schedule')
      .eq('enabled', true);

    if (error) {
      console.error('Error fetching category users:', error);
      return { sent, failed, details };
    }

    if (!users || users.length === 0) {
      return { sent, failed, details };
    }

    // 현재 시간대 확인 (시간대 필터링)
    const now = new Date();
    const hour = now.getHours();
    const isMorning = hour >= 7 && hour < 9;
    const isAfternoon = hour >= 12 && hour < 14;
    const isEvening = hour >= 18 && hour < 20;

    // 카테고리 매칭 및 시간대 필터링
    const matchedUsers: Array<{
      device_id: string;
      subscription: PushSubscriptionJSON;
    }> = [];

    for (const user of users) {
      if (!user.push_subscription) continue;
      if (!user.categories) continue;

      // 시간대 체크
      const schedule = user.schedule || { morning: true, afternoon: false, evening: true };
      const isAllowedTime =
        (isMorning && schedule.morning) ||
        (isAfternoon && schedule.afternoon) ||
        (isEvening && schedule.evening);

      if (!isAllowedTime) continue;

      // 카테고리 매칭
      const categories = user.categories;
      const hasAllCategory = categories.all === true;
      const hasCategoryMatch = categories[newsItem.category] === true;

      if (hasAllCategory || hasCategoryMatch) {
        matchedUsers.push({
          device_id: user.device_id,
          subscription: user.push_subscription
        });
      }
    }

    // 매칭된 사용자에게 알림 전송
    if (matchedUsers.length > 0) {
      const payload = createCategoryNotificationPayload(
        newsItem.title,
        newsItem.category,
        newsItem.original_link,
        newsItem.media_name
      );

      const results = await sendPushNotificationBatch(matchedUsers, payload);

      for (const result of results) {
        if (result.result.success) {
          sent++;
        } else {
          failed++;

          // 만료된 구독 정리
          if (result.result.statusCode === 410) {
            await cleanupExpiredSubscription(result.device_id);
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
    console.error('Category notification error:', error);
  }

  return { sent, failed, details };
}
