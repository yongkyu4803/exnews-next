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

      // Supabase RPC 함수를 사용하여 업데이트 (JavaScript Client의 update() 버그 우회)
      const subscriptionString = JSON.stringify(subscription);

      console.log('[Subscribe API] ⚠️ RPC 함수 호출 직전:', {
        device_id,
        subscription_type: typeof subscriptionString,
        subscription_length: subscriptionString.length,
        subscription_preview: subscriptionString.substring(0, 100)
      });

      const { data, error } = await supabase
        .rpc('update_push_subscription', {
          p_device_id: device_id,
          p_subscription: subscriptionString
        });

      console.log('[Subscribe API] RPC 함수 결과:', {
        success: !error,
        error: error?.message,
        error_full: error,
        data_length: Array.isArray(data) ? data.length : 0,
        data_first: Array.isArray(data) && data.length > 0 ? data[0] : null
      });

      if (error) {
        console.error('[Subscribe API] ❌ RPC 함수 실패:', error);
        throw error;
      }

      // RPC 함수는 배열을 반환함
      const updatedRow = Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (!updatedRow?.push_subscription) {
        console.error('[Subscribe API] ⚠️ RPC는 성공했지만 push_subscription이 NULL!');
      }

      return res.status(200).json({
        message: 'Push subscription이 업데이트되었습니다.',
        data: updatedRow
      });
    } else {
      // 새로운 설정 생성 - RPC 함수 사용
      const subscriptionString = JSON.stringify(subscription);

      console.log('[Subscribe API] 새 레코드 생성 (RPC):', {
        device_id,
        subscription_type: typeof subscriptionString,
        subscription_length: subscriptionString.length
      });

      const { data, error } = await supabase
        .rpc('insert_push_subscription', {
          p_device_id: device_id,
          p_subscription: subscriptionString
        });

      if (error) {
        console.error('[Subscribe API] ❌ INSERT RPC 실패:', error);
        throw error;
      }

      const insertedRow = Array.isArray(data) && data.length > 0 ? data[0] : null;

      return res.status(201).json({
        message: 'Push subscription이 등록되었습니다.',
        data: insertedRow
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
