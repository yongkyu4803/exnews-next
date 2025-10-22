import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

/**
 * Push Subscription 등록/업데이트 API
 *
 * POST: PushSubscription 객체를 등록하거나 업데이트합니다.
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
    // 환경변수 검증 로깅
    console.log('[Subscribe API] 🔍 환경변수 확인:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...',
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
      expectedLength: 208 // 로컬 .env.local의 키 길이
    });

    const { device_id, subscription } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id가 필요합니다.' });
    }

    if (!subscription) {
      return res.status(400).json({ error: 'subscription이 필요합니다.' });
    }

    // 기존 설정이 있는지 확인
    const { data: existing } = await supabase
      .from('user_notification_settings')
      .select('id, enabled, categories, schedule, keywords, media_names')
      .eq('device_id', device_id)
      .single();

    if (existing) {
      // 기존 설정 업데이트 (push_subscription만)
      console.log('[Subscribe API] 기존 설정 발견, 업데이트 시작:', {
        device_id,
        existing_id: existing.id,
        subscription_type: typeof subscription,
        subscription_preview: JSON.stringify(subscription).substring(0, 100)
      });

      // 업데이트할 데이터 준비 (TEXT 타입이므로 JSON 문자열로 변환)
      const updateData = {
        push_subscription: JSON.stringify(subscription),  // TEXT 타입이면 문자열로!
        updated_at: new Date().toISOString()
      };

      console.log('[Subscribe API] ⚠️ UPDATE 직전 데이터 확인:', {
        updateData_type: typeof updateData.push_subscription,
        updateData_is_null: updateData.push_subscription === null,
        updateData_is_undefined: updateData.push_subscription === undefined,
        updateData_full: JSON.stringify(updateData)
      });

      // Supabase는 객체를 자동으로 JSONB로 변환하므로 그대로 전달
      const { data, error } = await supabase
        .from('user_notification_settings')
        .update(updateData)
        .eq('device_id', device_id)
        .select()
        .single();

      console.log('[Subscribe API] Update 결과:', {
        success: !error,
        error: error?.message,
        error_full: error,
        data_id: data?.id,
        has_subscription: !!data?.push_subscription,
        returned_subscription_type: typeof data?.push_subscription,
        returned_subscription_value: data?.push_subscription
      });

      if (error) {
        console.error('[Subscribe API] ❌ Update 실패:', error);
        throw error;
      }

      if (!data?.push_subscription) {
        console.error('[Subscribe API] ⚠️ Update는 성공했지만 push_subscription이 NULL!');
      }

      return res.status(200).json({
        message: 'Push subscription이 업데이트되었습니다.',
        data
      });
    } else {
      // 새로운 설정 생성 (기본값 사용)
      console.log('[Subscribe API] 새 레코드 생성:', {
        device_id,
        subscription_type: typeof subscription
      });

      const { data, error } = await supabase
        .from('user_notification_settings')
        .insert({
          device_id,
          push_subscription: JSON.stringify(subscription),  // TEXT 타입이면 문자열로!
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
            enabled: false,     // 기본적으로 시간 제한 비활성화 (24시간 알림)
            startTime: '09:00', // 기본 시작 시간: 오전 9시 (KST)
            endTime: '22:00'    // 기본 종료 시간: 오후 10시 (KST)
          },
          keywords: [],
          media_names: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json({
        message: 'Push subscription이 등록되었습니다.',
        data
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
