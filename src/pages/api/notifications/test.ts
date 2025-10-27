import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createKeywordNotificationPayload, sendPushNotificationBatch } from '@/utils/pushSender';

// Supabase Admin 클라이언트
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

interface TestResponse {
  success: boolean;
  message: string;
  data?: {
    totalSubscribers: number;
    testPayload: any;
    sendResults?: Array<{
      device_id: string;
      success: boolean;
      error?: string;
    }>;
  };
  error?: string;
}

/**
 * 푸시 알림 테스트 엔드포인트
 *
 * GET /api/notifications/test - 구독자 목록 조회
 * POST /api/notifications/test - 테스트 알림 전송
 *
 * 인증: 개발 환경 또는 API 키 필요
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResponse>
) {
  // 개발 환경 또는 API 키 확인
  const isDevelopment = process.env.NODE_ENV === 'development';
  const apiKey = req.headers['authorization'];
  const validApiKey = `Bearer ${process.env.CRON_API_KEY || ''}`;

  if (!isDevelopment && apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Development only or valid API key required'
    });
  }

  try {
    if (req.method === 'GET') {
      // 구독자 목록 조회
      const { data: subscribers, error } = await supabaseAdmin
        .from('keyword_push_subscriptions')
        .select('device_id, keywords, enabled, schedule_enabled, schedule_start, schedule_end')
        .eq('enabled', true);

      if (error) {
        throw new Error(`Failed to fetch subscribers: ${error.message}`);
      }

      return res.status(200).json({
        success: true,
        message: `Found ${subscribers?.length || 0} active subscribers`,
        data: {
          totalSubscribers: subscribers?.length || 0,
          testPayload: createKeywordNotificationPayload(
            '테스트 뉴스 제목입니다',
            ['테스트키워드'],
            'https://example.com/news/1',
            '테스트언론사'
          )
        }
      });
    }

    if (req.method === 'POST') {
      // 테스트 알림 전송
      const { deviceId, keywords, newsTitle, mediaName } = req.body;

      // 특정 기기에 전송하거나 모든 구독자에게 전송
      let query = supabaseAdmin
        .from('keyword_push_subscriptions')
        .select('device_id, endpoint, p256dh_key, auth_key, keywords')
        .eq('enabled', true);

      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }

      const { data: subscribers, error } = await query;

      if (error || !subscribers || subscribers.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No subscribers found'
        });
      }

      // 테스트 페이로드 생성
      const testPayload = createKeywordNotificationPayload(
        newsTitle || '🧪 테스트 알림: 이것은 테스트 푸시 알림입니다',
        keywords || ['테스트'],
        'https://exnews-next.vercel.app/',
        mediaName || '테스트시스템'
      );

      console.log('[Test] Sending test notification:', {
        recipients: subscribers.length,
        payload: testPayload
      });

      // 구독 정보 재구성
      const subscriptions = subscribers.map(sub => ({
        device_id: sub.device_id,
        subscription: {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          }
        }
      }));

      // 알림 전송
      const results = await sendPushNotificationBatch(subscriptions, testPayload);

      const sendResults = results.map(r => ({
        device_id: r.device_id,
        success: r.result.success,
        error: r.result.error
      }));

      const successCount = sendResults.filter(r => r.success).length;
      const failedCount = sendResults.filter(r => !r.success).length;

      console.log('[Test] Test notification results:', {
        total: sendResults.length,
        success: successCount,
        failed: failedCount
      });

      return res.status(200).json({
        success: true,
        message: `Test notification sent to ${subscribers.length} subscribers (${successCount} succeeded, ${failedCount} failed)`,
        data: {
          totalSubscribers: subscribers.length,
          testPayload,
          sendResults
        }
      });
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`
    });

  } catch (error) {
    console.error('[Test] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
