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
    const { landing } = req.query;

    // 랜딩 페이지 모드: 최신 1개 전체 + 이전 4개 날짜만
    if (landing === 'true') {
      logger.info('정치 리포트 랜딩 모드 조회 시작');

      // 전체 개수 먼저 조회
      const { count: totalCountResult } = await politicalSupabase
        .from(TABLES.NEWS_REPORTS)
        .select('*', { count: 'exact', head: true });

      // 최신 리포트 1개 (전체 데이터)
      const { data: latestData, error: latestError } = await politicalSupabase
        .from(TABLES.NEWS_REPORTS)
        .select('id, slug, topic, created_at, duration_ms, cost_usd, report_data')
        .order('created_at', { ascending: false })
        .limit(1);

      if (latestError) {
        logger.error('최신 리포트 조회 실패', latestError);
        throw latestError;
      }

      // 이전 4개 (id, created_at, slug만)
      const { data: previousData, error: previousError } = await politicalSupabase
        .from(TABLES.NEWS_REPORTS)
        .select('id, created_at, slug, topic')
        .order('created_at', { ascending: false })
        .range(1, 4); // 2번째~5번째

      if (previousError) {
        logger.error('이전 리포트 조회 실패', previousError);
        throw previousError;
      }

      // 최신 리포트 데이터 변환
      const latest = latestData?.[0] ? {
        id: latestData[0].id,
        slug: latestData[0].slug,
        topic: latestData[0].topic,
        created_at: latestData[0].created_at,
        duration_ms: latestData[0].duration_ms,
        cost_usd: latestData[0].cost_usd ? parseFloat(latestData[0].cost_usd).toFixed(4) : undefined,
        summary: latestData[0].report_data?.summary,
        keywords: latestData[0].report_data?.keywords?.map((k: any) => k.term) || [],
        report_data: latestData[0].report_data,
        source: 'supabase' as const
      } : null;

      logger.info('정치 리포트 랜딩 모드 조회 완료', {
        latestCount: latestData?.length || 0,
        previousCount: previousData?.length || 0,
        totalCount: totalCountResult || 0
      });

      return res.status(200).json({
        success: true,
        latest,
        previous: previousData || [],
        totalCount: totalCountResult || 0
      });
    }

    // 일반 페이지네이션 모드
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
