/**
 * 정치 뉴스 리포트 API - 목록 조회
 *
 * GET /api/political-reports
 * Response: { success: true, reports: ReportListItem[] }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { politicalSupabase, TABLES } from '@/lib/politicalSupabaseClient';
import { createLogger } from '@/utils/logger';
import type { ReportListItem } from '@/types/political-report';

const logger = createLogger('API:PoliticalReports');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Edge 캐싱 설정 (5분 캐시, 10분 stale-while-revalidate)
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    // 페이지네이션 파라미터
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;
    const startIndex = (page - 1) * pageSize;

    logger.info('정치 리포트 목록 조회 시작', { page, pageSize, startIndex });

    const { data, error, count } = await politicalSupabase
      .from(TABLES.NEWS_REPORTS)
      .select('id, slug, topic, created_at, duration_ms, cost_usd, report_data', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + pageSize - 1);

    if (error) {
      logger.error('Supabase 조회 실패', error);
      throw error;
    }

    // 데이터 변환: report_data에서 메타데이터 추출
    const reports: ReportListItem[] = (data || []).map((item: any) => ({
      id: item.id,
      slug: item.slug,
      topic: item.topic,
      created_at: item.created_at,
      duration_ms: item.duration_ms,
      cost_usd: item.cost_usd ? parseFloat(item.cost_usd).toFixed(4) : undefined,
      summary: item.report_data?.summary,
      keywords: item.report_data?.keywords?.map((k: any) => k.term) || [],
      source: 'supabase' as const
    }));

    logger.info('정치 리포트 목록 조회 완료', {
      page,
      pageSize,
      itemCount: reports.length,
      totalCount: count || 0
    });

    return res.status(200).json({
      success: true,
      reports,
      totalCount: count || 0
    });
  } catch (error: any) {
    logger.error('정치 리포트 목록 조회 실패', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch political reports'
    });
  }
}
