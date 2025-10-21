import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export interface NotificationSettings {
  id?: string;
  device_id: string;
  push_subscription?: PushSubscriptionJSON | null;
  enabled: boolean;
  categories: {
    [key: string]: boolean;
  };
  schedule: {
    enabled: boolean;    // 시간 제한 활성화 여부
    startTime: string;   // 시작 시간 (HH:mm 형식, 한국 시간 KST)
    endTime: string;     // 종료 시간 (HH:mm 형식, 한국 시간 KST)
  };
  keywords?: string[];
  media_names?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * 알림 설정 API
 *
 * GET: device_id로 설정 조회
 * POST: 새로운 설정 생성
 * PUT: 기존 설정 업데이트
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
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Notification settings API error:', error);
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

  const { data, error } = await supabase
    .from('user_notification_settings')
    .select('*')
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
 * POST: 새로운 설정 생성
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const settings: NotificationSettings = req.body;

  if (!settings.device_id) {
    return res.status(400).json({ error: 'device_id가 필요합니다.' });
  }

  // 기존 설정이 있는지 확인
  const { data: existing } = await supabase
    .from('user_notification_settings')
    .select('id')
    .eq('device_id', settings.device_id)
    .single();

  if (existing) {
    return res.status(409).json({
      error: '이미 설정이 존재합니다. PUT 메서드를 사용하세요.'
    });
  }

  // 새로운 설정 생성
  const { data, error } = await supabase
    .from('user_notification_settings')
    .insert({
      device_id: settings.device_id,
      push_subscription: settings.push_subscription || null,
      enabled: settings.enabled,
      categories: settings.categories,
      schedule: settings.schedule,
      keywords: settings.keywords || [],
      media_names: settings.media_names || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return res.status(201).json(data);
}

/**
 * PUT: 기존 설정 업데이트
 */
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const settings: NotificationSettings = req.body;

  if (!settings.device_id) {
    return res.status(400).json({ error: 'device_id가 필요합니다.' });
  }

  const { data, error } = await supabase
    .from('user_notification_settings')
    .update({
      push_subscription: settings.push_subscription || null,
      enabled: settings.enabled,
      categories: settings.categories,
      schedule: settings.schedule,
      keywords: settings.keywords || [],
      media_names: settings.media_names || [],
      updated_at: new Date().toISOString()
    })
    .eq('device_id', settings.device_id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 설정이 없으면 새로 생성
      return handlePost(req, res);
    }
    throw error;
  }

  return res.status(200).json(data);
}

/**
 * DELETE: 설정 삭제
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { device_id } = req.query;

  if (!device_id || typeof device_id !== 'string') {
    return res.status(400).json({ error: 'device_id가 필요합니다.' });
  }

  const { error } = await supabase
    .from('user_notification_settings')
    .delete()
    .eq('device_id', device_id);

  if (error) {
    throw error;
  }

  return res.status(204).end();
}
