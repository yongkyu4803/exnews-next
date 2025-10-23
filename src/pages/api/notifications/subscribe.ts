import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * Push Subscription 등록/업데이트 API (최적화 버전)
 *
 * POST: PushSubscription 객체를 분해하여 안정적으로 저장
 *
 * 변경사항:
 * - JSONB 제거 → TEXT 필드 3개로 분해 (endpoint, p256dh_key, auth_key)
 * - 카테고리 제거 → 키워드만 관리
 * - 단일 테이블 사용 → keyword_push_subscriptions
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Service Role 클라이언트 생성 (매 요청마다 새로 생성)
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

    console.log('[Subscribe API] 요청 수신');

    const { device_id, subscription } = req.body;

    // 필수 파라미터 검증
    if (!device_id) {
      return res.status(400).json({ error: 'device_id가 필요합니다.' });
    }

    if (!subscription) {
      return res.status(400).json({ error: 'subscription이 필요합니다.' });
    }

    // subscription 객체 검증 및 분해
    const { endpoint, keys } = subscription;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      console.error('[Subscribe API] ❌ subscription 객체 형식 오류:', subscription);
      return res.status(400).json({
        error: 'subscription 형식이 올바르지 않습니다.',
        required: {
          endpoint: '필수',
          keys: {
            p256dh: '필수',
            auth: '필수'
          }
        }
      });
    }

    console.log('[Subscribe API] Subscription 분해:', {
      device_id,
      endpoint_preview: endpoint.substring(0, 50) + '...',
      has_p256dh: !!keys.p256dh,
      has_auth: !!keys.auth
    });

    // UPSERT 실행 (device_id 기준으로 INSERT or UPDATE)
    const { data, error } = await supabaseAdmin
      .from('keyword_push_subscriptions')
      .upsert(
        {
          device_id,
          endpoint,
          p256dh_key: keys.p256dh,
          auth_key: keys.auth,
          enabled: true,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'device_id',
          ignoreDuplicates: false
        }
      )
      .select('id, device_id, enabled, keywords, created_at, updated_at')
      .single();

    if (error) {
      console.error('[Subscribe API] ❌ UPSERT 실패:', error);
      throw error;
    }

    console.log('[Subscribe API] ✅ UPSERT 성공:', {
      id: data.id,
      device_id: data.device_id,
      enabled: data.enabled,
      keywords_count: data.keywords?.length || 0
    });

    // 성공 응답
    return res.status(200).json({
      success: true,
      message: 'Push subscription이 저장되었습니다.',
      data: {
        id: data.id,
        device_id: data.device_id,
        enabled: data.enabled,
        keywords: data.keywords || [],
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    });

  } catch (error) {
    console.error('[Subscribe API] ❌ 서버 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
