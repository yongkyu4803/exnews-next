import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { matchKeywords } from '@/utils/keywordMatcher';
import {
  sendPushNotificationBatch,
  createKeywordNotificationPayload,
  cleanupExpiredSubscription
} from '@/utils/pushSender';
import { isWithinSchedule } from '@/utils/timeZoneHelper';
import { NewsItem } from '@/types';

interface CronResponse {
  success: boolean;
  processedNews: number;
  keywordSent: number;
  failed: number;
  message?: string;
  error?: string;
}

/**
 * Vercel Cron Job - 새 뉴스 체크 및 푸시 알림 자동 발송
 *
 * 스케줄: 매 5분마다
 * 동작: 최근 6분 이내 발행된 미발송 뉴스에 대해 푸시 알림 발송
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CronResponse>
) {
  // Vercel Cron 또는 GitHub Actions 인증 확인
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isGitHubActions = req.headers['x-github-actions'];
  const cronApiKey = req.headers['authorization'];
  const validApiKey = `Bearer ${process.env.CRON_API_KEY || ''}`;

  // 인증 확인: Vercel Cron, GitHub Actions (with API key), 또는 개발 환경
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isAuthorized = isVercelCron ||
                       (isGitHubActions && cronApiKey === validApiKey && validApiKey !== 'Bearer ') ||
                       isDevelopment;

  if (!isAuthorized) {
    console.log('[Cron] Unauthorized request');
    return res.status(401).json({
      success: false,
      processedNews: 0,
      keywordSent: 0,
      failed: 0,
      error: 'Unauthorized'
    });
  }

  const source = isVercelCron ? 'Vercel Cron' : (isGitHubActions ? 'GitHub Actions' : 'Development');
  console.log(`[Cron] Authorized request from ${source}`);

  console.log('[Cron] Starting check-new-news job...');
  const startTime = Date.now();

  try {
    // Service Role 클라이언트 생성
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

    // 1. 최근 6분 이내 발행된 미발송 뉴스 조회
    // Vercel 무료 플랜: 최대 10초 제한 - 배치 크기 제한 필요
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    const BATCH_SIZE = 5; // 한 번에 최대 5개만 처리

    const { data: recentNews, error: newsError } = await supabaseAdmin
      .from('news')
      .select('*')
      .gte('pub_date', sixMinutesAgo.toISOString())
      .is('notification_sent_at', null)
      .order('pub_date', { ascending: false })
      .limit(BATCH_SIZE);

    if (newsError) {
      console.error('[Cron] Error fetching news:', newsError);
      throw new Error(`Failed to fetch news: ${newsError.message}`);
    }

    if (!recentNews || recentNews.length === 0) {
      console.log('[Cron] No new news to process');
      return res.status(200).json({
        success: true,
        processedNews: 0,
        keywordSent: 0,
        failed: 0,
        message: 'No new news to process'
      });
    }

    console.log(`[Cron] Found ${recentNews.length} new news items`);

    // 2. 각 뉴스에 대해 키워드 기반 푸시 알림 발송
    let totalKeywordSent = 0;
    let totalFailed = 0;

    for (const newsItem of recentNews as NewsItem[]) {
      console.log(`[Cron] Processing news:`, {
        title: newsItem.title,
        category: newsItem.category,
        pub_date: newsItem.pub_date
      });

      // 키워드 기반 알림 발송만
      const keywordResult = await sendKeywordNotifications(newsItem, supabaseAdmin);
      totalKeywordSent += keywordResult.sent;
      totalFailed += keywordResult.failed;

      // 3. 알림 발송 완료 기록
      await markNotificationSent(newsItem.id as number, supabaseAdmin);
    }

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[Cron] Job completed in ${executionTime}s:`, {
      processed: recentNews.length,
      keywordSent: totalKeywordSent,
      failed: totalFailed
    });

    return res.status(200).json({
      success: true,
      processedNews: recentNews.length,
      keywordSent: totalKeywordSent,
      failed: totalFailed,
      message: `Processed ${recentNews.length} news items in ${executionTime}s`
    });

  } catch (error) {
    console.error('[Cron] Job failed:', error);
    return res.status(500).json({
      success: false,
      processedNews: 0,
      keywordSent: 0,
      failed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 키워드 기반 푸시 알림 발송 (새 테이블 구조)
 */
async function sendKeywordNotifications(newsItem: NewsItem, supabaseAdmin: any): Promise<{
  sent: number;
  failed: number;
}> {
  let sent = 0;
  let failed = 0;

  try {
    // 키워드 알림 활성화 사용자 조회 (새 테이블: keyword_push_subscriptions)
    const { data: users, error } = await supabaseAdmin
      .from('keyword_push_subscriptions')
      .select('device_id, endpoint, p256dh_key, auth_key, keywords, schedule_enabled, schedule_start, schedule_end')
      .eq('enabled', true)
      .not('keywords', 'is', null)
      .neq('keywords', '{}');

    console.log(`[Cron][Keyword] Fetched ${users?.length || 0} users with keywords`);

    if (error || !users || users.length === 0) {
      console.log(`[Cron][Keyword] No users to process (error: ${error?.message || 'none'})`);
      return { sent, failed };
    }

    // 각 사용자의 키워드 매칭
    const matchedUsers: Array<{
      device_id: string;
      subscription: any;
      matchedKeywords: string[];
    }> = [];

    let usersWithValidKeywords = 0;
    let usersWithSubscription = 0;
    let usersPassedSchedule = 0;

    for (const user of users) {
      if (!user.keywords || user.keywords.length === 0) {
        console.log(`[Cron][Keyword] User ${user.device_id}: no keywords`);
        continue;
      }
      usersWithValidKeywords++;

      if (!user.endpoint || !user.p256dh_key || !user.auth_key) {
        console.log(`[Cron][Keyword] User ${user.device_id}: incomplete subscription data`);
        continue;
      }
      usersWithSubscription++;

      // 시간대 체크 (새 구조: schedule_enabled, schedule_start, schedule_end)
      const schedule = {
        enabled: user.schedule_enabled || false,
        startTime: user.schedule_start || '09:00',
        endTime: user.schedule_end || '22:00'
      };

      if (!isWithinSchedule(schedule)) {
        console.log(`[Cron][Keyword] User ${user.device_id}: outside schedule`, {
          schedule,
          currentTime: new Date().toISOString()
        });
        continue;
      }
      usersPassedSchedule++;

      // 키워드 매칭
      const matchResult = matchKeywords(
        {
          title: newsItem.title,
          description: newsItem.description || ''
        },
        user.keywords
      );

      console.log(`[Cron][Keyword] User ${user.device_id}: keyword match = ${matchResult.matched}`, {
        userKeywords: user.keywords,
        matchedKeywords: matchResult.matchedKeywords
      });

      if (matchResult.matched) {
        // 새 구조: 구독 정보를 객체로 재구성
        const subscription = {
          endpoint: user.endpoint,
          keys: {
            p256dh: user.p256dh_key,
            auth: user.auth_key
          }
        };

        matchedUsers.push({
          device_id: user.device_id,
          subscription: subscription,
          matchedKeywords: matchResult.matchedKeywords
        });
      }
    }

    console.log(`[Cron][Keyword] Filter results:`, {
      totalUsers: users.length,
      withValidKeywords: usersWithValidKeywords,
      withSubscription: usersWithSubscription,
      passedSchedule: usersPassedSchedule,
      finalMatched: matchedUsers.length
    });

    if (matchedUsers.length === 0) {
      return { sent, failed };
    }

    console.log(`[Cron] Matched ${matchedUsers.length} users for keyword notifications`);

    // 푸시 알림 발송
    const subscriptions = matchedUsers.map(user => ({
      device_id: user.device_id,
      subscription: user.subscription
    }));

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
    }

  } catch (error) {
    console.error('[Cron] Error sending keyword notifications:', error);
  }

  return { sent, failed };
}


/**
 * 알림 발송 완료 기록 (중복 발송 방지)
 */
async function markNotificationSent(newsId: number, supabaseAdmin: any): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('news')
      .update({ notification_sent_at: new Date().toISOString() })
      .eq('id', newsId);

    if (error) {
      console.error(`[Cron] Error marking news ${newsId} as sent:`, error);
    } else {
      console.log(`[Cron] Marked news ${newsId} as sent`);
    }
  } catch (error) {
    console.error(`[Cron] Exception marking news ${newsId} as sent:`, error);
  }
}
