import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Service Role 클라이언트 생성 (모든 권한, 서버 전용)
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

/**
 * Push Subscription 등록/업데이트 API
 *
 * POST: PushSubscription 객체를 등록하거나 업데이트합니다.
 * Service Role Key를 사용하여 권한 문제 없이 직접 DB 업데이트
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
    console.log('[Subscribe API] 🔍 Service Role 사용');

    const { device_id, subscription } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id가 필요합니다.' });
    }

    if (!subscription) {
      return res.status(400).json({ error: 'subscription이 필요합니다.' });
    }

    // 기존 설정이 있는지 확인
    const { data: existing } = await supabaseAdmin
      .from('user_notification_settings')
      .select('id, enabled, categories, schedule, keywords, media_names')
      .eq('device_id', device_id)
      .single();

    if (existing) {
      // 기존 설정 업데이트 - Service Role로 직접 UPDATE
      console.log('[Subscribe API] 기존 설정 발견, Service Role로 직접 업데이트:', {
        device_id,
        existing_id: existing.id
      });

      const subscriptionString = JSON.stringify(subscription);

      const { data, error } = await supabaseAdmin
        .from('user_notification_settings')
        .update({
          subscription_data: subscriptionString,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', device_id)
        .select()
        .single();

      if (error) {
        console.error('[Subscribe API] ❌ 업데이트 실패:', error);
        throw error;
      }

      console.log('[Subscribe API] ✅ 업데이트 성공:', {
        has_subscription_data: !!data?.subscription_data,
        subscription_data_length: data?.subscription_data?.length || 0
      });

      return res.status(200).json({
        message: 'Push subscription이 업데이트되었습니다.',
        data,
        has_subscription: !!data?.subscription_data
      });
    } else {
      // 새로운 설정 생성 - Service Role로 직접 INSERT
      console.log('[Subscribe API] 새 레코드 생성, Service Role로 직접 INSERT:', {
        device_id
      });

      const subscriptionString = JSON.stringify(subscription);

      const { data, error } = await supabaseAdmin
        .from('user_notification_settings')
        .insert({
          device_id,
          subscription_data: subscriptionString,
          enabled: true,
          categories: {
            all: true,
            정치: false,
            경제: false,
            사회: false,
            국제: false,
            문화: false,
            '연예/스포츠': false,
            기타: false
          },
          schedule: {
            enabled: false,
            startTime: '09:00',
            endTime: '22:00'
          },
          keywords: [],
          media_names: []
        })
        .select()
        .single();

      if (error) {
        console.error('[Subscribe API] ❌ INSERT 실패:', error);
        throw error;
      }

      console.log('[Subscribe API] ✅ INSERT 성공:', {
        has_subscription_data: !!data?.subscription_data,
        subscription_data_length: data?.subscription_data?.length || 0
      });

      return res.status(201).json({
        message: 'Push subscription이 등록되었습니다.',
        data,
        has_subscription: !!data?.subscription_data
      });
    }
  } catch (error) {
    console.error('Push subscription API error:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
