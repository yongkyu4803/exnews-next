import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * 키워드 푸시 알림 설정 인터페이스 (단순화)
 */
export interface KeywordNotificationSettings {
  id?: string;
  device_id: string;
  enabled: boolean;
  keywords: string[];
  schedule_enabled: boolean;
  schedule_start: string;  // HH:mm 형식 (KST)
  schedule_end: string;    // HH:mm 형식 (KST)
  created_at?: string;
  updated_at?: string;
}

/**
 * 알림 설정 API (키워드 전용)
 *
 * GET: device_id로 설정 조회
 * PUT: 설정 업데이트 (키워드, 활성화, 시간대)
 * DELETE: 설정 삭제 (구독 취소)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('[Settings API] 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * GET: 설정 조회
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { device_id } = req.query;

  if (!device_id || typeof device_id !== 'string') {
    return res.status(400).json({ error: 'device_id가 필요합니다.' });
  }

  // Service Role 클라이언트
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

  const { data, error } = await supabaseAdmin
    .from('keyword_push_subscriptions')
    .select('id, device_id, enabled, keywords, schedule_enabled, schedule_start, schedule_end, created_at, updated_at')
    .eq('device_id', device_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 데이터 없음 - 정상 케이스
      return res.status(404).json({ error: '설정을 찾을 수 없습니다.' });
    }
    throw error;
  }

  return res.status(200).json(data);
}

/**
 * PUT: 설정 업데이트 (키워드, 활성화, 시간대만)
 */
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { device_id, enabled, keywords, schedule_enabled, schedule_start, schedule_end } = req.body;

  if (!device_id) {
    return res.status(400).json({ error: 'device_id가 필요합니다.' });
  }

  // Service Role 클라이언트
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

  // 업데이트할 필드만 포함
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (typeof enabled === 'boolean') {
    updateData.enabled = enabled;
  }

  if (Array.isArray(keywords)) {
    updateData.keywords = keywords;
  }

  if (typeof schedule_enabled === 'boolean') {
    updateData.schedule_enabled = schedule_enabled;
  }

  if (schedule_start) {
    updateData.schedule_start = schedule_start;
  }

  if (schedule_end) {
    updateData.schedule_end = schedule_end;
  }

  console.log('[Settings API] 업데이트 데이터:', {
    device_id,
    fields: Object.keys(updateData)
  });

  const { data, error } = await supabaseAdmin
    .from('keyword_push_subscriptions')
    .update(updateData)
    .eq('device_id', device_id)
    .select('id, device_id, enabled, keywords, schedule_enabled, schedule_start, schedule_end, updated_at')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: '설정을 찾을 수 없습니다. 먼저 푸시 알림을 구독해주세요.'
      });
    }
    throw error;
  }

  console.log('[Settings API] ✅ 업데이트 성공:', {
    device_id: data.device_id,
    enabled: data.enabled,
    keywords_count: data.keywords?.length || 0
  });

  return res.status(200).json(data);
}

/**
 * DELETE: 설정 삭제 (구독 취소)
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { device_id } = req.query;

  if (!device_id || typeof device_id !== 'string') {
    return res.status(400).json({ error: 'device_id가 필요합니다.' });
  }

  // Service Role 클라이언트
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

  const { error } = await supabaseAdmin
    .from('keyword_push_subscriptions')
    .delete()
    .eq('device_id', device_id);

  if (error) {
    throw error;
  }

  console.log('[Settings API] ✅ 구독 삭제 성공:', device_id);

  return res.status(204).end();
}
