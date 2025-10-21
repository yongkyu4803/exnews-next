import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { matchKeywords } from '@/utils/keywordMatcher';
import {
  sendPushNotificationBatch,
  createKeywordNotificationPayload,
  createCategoryNotificationPayload,
  cleanupExpiredSubscription
} from '@/utils/pushSender';
import { isWithinSchedule } from '@/utils/timeZoneHelper';
import { NewsItem } from '@/types';

interface CronResponse {
  success: boolean;
  processedNews: number;
  keywordSent: number;
  categorySent: number;
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
  // Vercel Cron 인증 확인
  const isVercelCron = req.headers['x-vercel-cron'] === '1';

  if (!isVercelCron) {
    console.log('[Cron] Unauthorized request - missing x-vercel-cron header');
    return res.status(401).json({
      success: false,
      processedNews: 0,
      keywordSent: 0,
      categorySent: 0,
      failed: 0,
      error: 'Unauthorized - This endpoint can only be called by Vercel Cron'
    });
  }

  console.log('[Cron] Starting check-new-news job...');
  const startTime = Date.now();

  try {
    // 1. 최근 6분 이내 발행된 미발송 뉴스 조회
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);

    const { data: recentNews, error: newsError } = await supabase
      .from('news')
      .select('*')
      .gte('pub_date', sixMinutesAgo.toISOString())
      .is('notification_sent_at', null)
      .order('pub_date', { ascending: false });

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
        categorySent: 0,
        failed: 0,
        message: 'No new news to process'
      });
    }

    console.log(`[Cron] Found ${recentNews.length} new news items`);

    // 2. 각 뉴스에 대해 푸시 알림 발송
    let totalKeywordSent = 0;
    let totalCategorySent = 0;
    let totalFailed = 0;

    for (const newsItem of recentNews as NewsItem[]) {
      console.log(`[Cron] Processing news: ${newsItem.title}`);

      // 2a. 키워드 기반 알림 발송
      const keywordResult = await sendKeywordNotifications(newsItem);
      totalKeywordSent += keywordResult.sent;
      totalFailed += keywordResult.failed;

      // 2b. 카테고리 기반 알림 발송
      const categoryResult = await sendCategoryNotifications(newsItem);
      totalCategorySent += categoryResult.sent;
      totalFailed += categoryResult.failed;

      // 3. 알림 발송 완료 기록
      await markNotificationSent(newsItem.id as number);
    }

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[Cron] Job completed in ${executionTime}s:`, {
      processed: recentNews.length,
      keywordSent: totalKeywordSent,
      categorySent: totalCategorySent,
      failed: totalFailed
    });

    return res.status(200).json({
      success: true,
      processedNews: recentNews.length,
      keywordSent: totalKeywordSent,
      categorySent: totalCategorySent,
      failed: totalFailed,
      message: `Processed ${recentNews.length} news items in ${executionTime}s`
    });

  } catch (error) {
    console.error('[Cron] Job failed:', error);
    return res.status(500).json({
      success: false,
      processedNews: 0,
      keywordSent: 0,
      categorySent: 0,
      failed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 키워드 기반 푸시 알림 발송
 */
async function sendKeywordNotifications(newsItem: NewsItem): Promise<{
  sent: number;
  failed: number;
}> {
  let sent = 0;
  let failed = 0;

  try {
    // 키워드 알림 활성화 사용자 조회
    const { data: users, error } = await supabase
      .from('user_notification_settings')
      .select('device_id, push_subscription, keywords, schedule')
      .eq('enabled', true)
      .not('keywords', 'is', null)
      .neq('keywords', '{}');

    if (error || !users || users.length === 0) {
      return { sent, failed };
    }

    // 각 사용자의 키워드 매칭
    const matchedUsers: Array<{
      device_id: string;
      subscription: any;
      matchedKeywords: string[];
    }> = [];

    for (const user of users) {
      if (!user.keywords || user.keywords.length === 0) continue;
      if (!user.push_subscription) continue;

      // 시간대 체크
      if (!isWithinSchedule(user.schedule)) {
        console.log(`[Cron] Skipping user ${user.device_id} - outside schedule`);
        continue;
      }

      // 키워드 매칭
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
 * 카테고리 기반 푸시 알림 발송
 */
async function sendCategoryNotifications(newsItem: NewsItem): Promise<{
  sent: number;
  failed: number;
}> {
  let sent = 0;
  let failed = 0;

  try {
    // 해당 카테고리 알림 활성화 사용자 조회
    const { data: users, error } = await supabase
      .from('user_notification_settings')
      .select('device_id, push_subscription, categories, schedule')
      .eq('enabled', true);

    if (error || !users || users.length === 0) {
      return { sent, failed };
    }

    // 카테고리 매칭 및 시간대 필터링
    const matchedUsers = users.filter(user => {
      if (!user.push_subscription) return false;

      // 시간대 체크
      if (!isWithinSchedule(user.schedule)) {
        console.log(`[Cron] Skipping user ${user.device_id} - outside schedule`);
        return false;
      }

      // 카테고리 매칭
      const categories = user.categories || {};
      return categories['all'] === true || categories[newsItem.category] === true;
    });

    if (matchedUsers.length === 0) {
      return { sent, failed };
    }

    console.log(`[Cron] Matched ${matchedUsers.length} users for category notifications`);

    // 푸시 알림 발송
    const subscriptions = matchedUsers.map(user => ({
      device_id: user.device_id,
      subscription: user.push_subscription
    }));

    const payload = createCategoryNotificationPayload(
      newsItem.title,
      newsItem.category,
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
    console.error('[Cron] Error sending category notifications:', error);
  }

  return { sent, failed };
}

/**
 * 알림 발송 완료 기록 (중복 발송 방지)
 */
async function markNotificationSent(newsId: number): Promise<void> {
  try {
    const { error } = await supabase
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
