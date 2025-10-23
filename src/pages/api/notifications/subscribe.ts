import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * Push Subscription 등록/업데이트 API
 *
 * POST: PushSubscription 객체를 등록하거나 업데이트합니다.
 * Service Role Key를 사용하여 권한 문제 없이 직접 DB 업데이트
 *
 * IMPORTANT: Service Role 클라이언트를 매 요청마다 새로 생성하여
 * User Session과의 혼선 가능성을 제거합니다.
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
    // 🔥 매 요청마다 새로운 Service Role 클라이언트 생성
    // User Session과의 혼선 방지
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

    console.log('[Subscribe API] 🔍 새로운 Service Role 클라이언트 생성');

    const { device_id, subscription } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id가 필요합니다.' });
    }

    if (!subscription) {
      return res.status(400).json({ error: 'subscription이 필요합니다.' });
    }

    const subscriptionString = JSON.stringify(subscription);

    console.log('[Subscribe API] 🔥 RPC 함수로 트랜잭션 보장:', {
      device_id,
      data_length: subscriptionString.length
    });

    // 🔥 RPC 함수 호출로 트랜잭션 보장
    const { data, error } = await supabaseAdmin
      .rpc('upsert_push_subscription', {
        p_device_id: device_id,
        p_subscription_data: subscriptionString
      });

    if (error) {
      console.error('[Subscribe API] ❌ RPC 실패:', error);
      throw error;
    }

    // RPC는 배열을 반환하므로 첫 번째 요소 추출
    const result = Array.isArray(data) ? data[0] : data;

    // 🔍 상세 검증 로그
    // 🔥 subscription_data_test 컬럼 사용 (subscription_data 컬럼에 문제 있음!)
    const hasData = !!result?.subscription_data_test;
    const dataLength = result?.subscription_data_test?.length || 0;
    const isExpectedLength = dataLength === subscriptionString.length;

    console.log('[Subscribe API] 🔍 RPC 결과 검증 (subscription_data_test 컬럼 사용):', {
      has_subscription_data: hasData,
      subscription_data_length: dataLength,
      expected_length: subscriptionString.length,
      length_match: isExpectedLength,
      subscription_preview: result?.subscription_data_test?.substring(0, 100) || 'NULL',
      device_id: result?.device_id,
      id: result?.id
    });

    if (!hasData) {
      console.error('[Subscribe API] 🚨 경고: RPC 성공했으나 subscription_data_test가 NULL!');
      console.error('[Subscribe API] 🚨 원본 데이터:', subscriptionString.substring(0, 200));
      console.error('[Subscribe API] 🚨 RPC 반환값:', JSON.stringify(result));
    }

    return res.status(200).json({
      message: 'Push subscription이 저장되었습니다.',
      data: result,
      has_subscription: hasData,
      verification: {
        data_persisted: hasData,
        length_match: isExpectedLength
      }
    });

    /*
    // ========================================================================
    // 이전 방식 (JavaScript Client - 트랜잭션 미지원으로 인해 커밋 안됨)
    // ========================================================================
    // Supabase JavaScript Client는 네이티브 트랜잭션을 지원하지 않습니다.
    // INSERT/UPDATE는 성공하고 .select()도 데이터를 반환하지만,
    // 실제 DB 커밋이 되지 않아 새로고침 시 NULL로 돌아가는 문제 발생.
    //
    // 해결책: RPC 함수로 명시적 트랜잭션 보장
    // ========================================================================

    if (existing) {
      // 기존 설정 업데이트 - Service Role로 직접 UPDATE
      console.log('[Subscribe API] 기존 설정 발견, Service Role로 직접 업데이트:', {
        device_id,
        existing_id: existing.id
      });

      const subscriptionString = JSON.stringify(subscription);

      // 🔥 UPDATE 실행 (.select() 없이 순수 UPDATE만)
      const { error: updateError } = await supabaseAdmin
        .from('user_notification_settings')
        .update({
          subscription_data: subscriptionString,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', device_id);

      if (updateError) {
        console.error('[Subscribe API] ❌ 업데이트 실패:', updateError);
        throw updateError;
      }

      console.log('[Subscribe API] ⏳ UPDATE 완료, 50ms 대기 후 검증...');

      // 🔥 DB 커밋을 위한 짧은 대기
      await new Promise(resolve => setTimeout(resolve, 50));

      // 🔥 완전히 독립적인 SELECT로 실제 DB 상태 확인
      const { data: verification, error: verifyError } = await supabaseAdmin
        .from('user_notification_settings')
        .select('id, device_id, subscription_data, enabled, updated_at')
        .eq('device_id', device_id)
        .single();

      if (verifyError) {
        console.error('[Subscribe API] ❌ 검증 SELECT 실패:', verifyError);
        throw verifyError;
      }

      // 🔍 상세 검증 로그
      const hasData = !!verification?.subscription_data;
      const dataLength = verification?.subscription_data?.length || 0;
      const isExpectedLength = dataLength === subscriptionString.length;

      console.log('[Subscribe API] 🔍 검증 결과:', {
        has_subscription_data: hasData,
        subscription_data_length: dataLength,
        expected_length: subscriptionString.length,
        length_match: isExpectedLength,
        subscription_preview: verification?.subscription_data?.substring(0, 100) || 'NULL',
        device_id: verification?.device_id,
        id: verification?.id
      });

      if (!hasData) {
        console.error('[Subscribe API] 🚨 경고: UPDATE는 성공했으나 검증 시 subscription_data가 NULL!');
        console.error('[Subscribe API] 🚨 원본 데이터:', subscriptionString.substring(0, 200));
      }

      return res.status(200).json({
        message: 'Push subscription이 업데이트되었습니다.',
        data: verification,
        has_subscription: hasData,
        verification: {
          data_persisted: hasData,
          length_match: isExpectedLength
        }
      });
    } else {
      // 새로운 설정 생성 - Service Role로 직접 INSERT
      console.log('[Subscribe API] 새 레코드 생성, Service Role로 직접 INSERT:', {
        device_id
      });

      const subscriptionString = JSON.stringify(subscription);

      // 🔥 INSERT 실행 (.select() 없이 순수 INSERT만)
      const { error: insertError } = await supabaseAdmin
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
        });

      if (insertError) {
        console.error('[Subscribe API] ❌ INSERT 실패:', insertError);
        throw insertError;
      }

      console.log('[Subscribe API] ⏳ INSERT 완료, 50ms 대기 후 검증...');

      // 🔥 DB 커밋을 위한 짧은 대기
      await new Promise(resolve => setTimeout(resolve, 50));

      // 🔥 완전히 독립적인 SELECT로 실제 DB 상태 확인
      const { data: verification, error: verifyError } = await supabaseAdmin
        .from('user_notification_settings')
        .select('id, device_id, subscription_data, enabled, updated_at')
        .eq('device_id', device_id)
        .single();

      if (verifyError) {
        console.error('[Subscribe API] ❌ 검증 SELECT 실패:', verifyError);
        throw verifyError;
      }

      // 🔍 상세 검증 로그
      const hasData = !!verification?.subscription_data;
      const dataLength = verification?.subscription_data?.length || 0;
      const isExpectedLength = dataLength === subscriptionString.length;

      console.log('[Subscribe API] 🔍 검증 결과:', {
        has_subscription_data: hasData,
        subscription_data_length: dataLength,
        expected_length: subscriptionString.length,
        length_match: isExpectedLength,
        subscription_preview: verification?.subscription_data?.substring(0, 100) || 'NULL',
        device_id: verification?.device_id,
        id: verification?.id
      });

      if (!hasData) {
        console.error('[Subscribe API] 🚨 경고: INSERT는 성공했으나 검증 시 subscription_data가 NULL!');
        console.error('[Subscribe API] 🚨 원본 데이터:', subscriptionString.substring(0, 200));
      }

      return res.status(201).json({
        message: 'Push subscription이 등록되었습니다.',
        data: verification,
        has_subscription: hasData,
        verification: {
          data_persisted: hasData,
          length_match: isExpectedLength
        }
      });
    }
    */
  } catch (error) {
    console.error('Push subscription API error:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
