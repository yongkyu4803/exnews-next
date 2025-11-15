import { supabase } from '@/lib/supabaseClient';
import { createLogger } from '@/utils/logger';
import type { NextApiRequest, NextApiResponse } from 'next';

const logger = createLogger('API:Bills:Detail');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    logger.info('법안 리포트 상세 조회 시작', { id });

    let data = null;
    let error = null;

    // Check if ID looks like a UUID (contains hyphens and is 36 chars)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUUID) {
      // Try ID first (UUID format) - JOIN with bills
      logger.info('UUID 형식으로 조회', { id });
      const result = await supabase
        .from('bills_monitor_reports')
        .select(`
          *,
          bills:bills_monitor_bills(*)
        `)
        .eq('is_published', true)
        .eq('id', id)
        .single();

      data = result.data;
      error = result.error;
    }

    // If not found by ID or not UUID, try by slug - JOIN with bills
    if (!data && (!error || error.code === 'PGRST116')) {
      logger.info('slug로 조회', { id });
      const slugResult = await supabase
        .from('bills_monitor_reports')
        .select(`
          *,
          bills:bills_monitor_bills(*)
        `)
        .eq('is_published', true)
        .eq('slug', id)
        .single();

      data = slugResult.data;
      error = slugResult.error;
    }

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn('법안 리포트를 찾을 수 없음', { id });
        return res.status(404).json({ error: 'Bill report not found' });
      }

      logger.error('Supabase 조회 실패', error);
      throw error;
    }

    logger.info('법안 리포트 상세 조회 완료', { id, slug: data.slug });

    return res.status(200).json(data);
  } catch (error: any) {
    logger.error('법안 리포트 상세 조회 실패', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    });
  }
}
