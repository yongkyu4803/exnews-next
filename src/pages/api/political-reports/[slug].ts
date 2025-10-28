/**
 * 정치 뉴스 리포트 API - 상세 조회
 *
 * GET /api/political-reports/[slug]
 * Response: { success: true, report: SupabaseNewsReport }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { politicalSupabase, TABLES } from '@/lib/politicalSupabaseClient';
import { createLogger } from '@/utils/logger';
import type { SupabaseNewsReport } from '@/types/political-report';

const logger = createLogger('API:PoliticalReports:Slug');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ success: false, error: 'Slug is required' });
  }

  try {
    logger.info('정치 리포트 상세 조회 시작', { slug });

    const { data, error } = await politicalSupabase
      .from(TABLES.NEWS_REPORTS)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn('리포트를 찾을 수 없음', { slug });
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      logger.error('Supabase 조회 실패', error);
      throw error;
    }

    logger.info('정치 리포트 상세 조회 완료', { slug, id: data.id });

    return res.status(200).json({
      success: true,
      report: data as SupabaseNewsReport
    });
  } catch (error: any) {
    logger.error('정치 리포트 상세 조회 실패', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch political report'
    });
  }
}
