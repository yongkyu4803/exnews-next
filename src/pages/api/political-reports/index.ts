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

      // 🚀 Phase 1.2: 3번의 DB 쿼리 → 1번으로 통합 (count + latest + previous)
      // 최신 5개를 한 번에 조회 후 메모리에서 분리
      const { data: allData, error: queryError, count: totalCountResult } = await politicalSupabase
        .from(TABLES.NEWS_REPORTS)
        .select('id, slug, topic, created_at, duration_ms, cost_usd, report_data', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      if (queryError) {
        logger.error('리포트 조회 실패', queryError);
        throw queryError;
      }

      // 메모리에서 최신 1개와 이전 4개로 분리
      const latest = allData?.[0] ? {
        id: allData[0].id,
        slug: allData[0].slug,
        topic: allData[0].topic,
        created_at: allData[0].created_at,
        duration_ms: allData[0].duration_ms,
        cost_usd: allData[0].cost_usd ? parseFloat(allData[0].cost_usd).toFixed(4) : undefined,
        summary: allData[0].report_data?.summary,
        keywords: allData[0].report_data?.keywords?.map((k: any) => k.term) || [],
        report_data: allData[0].report_data,
        source: 'supabase' as const
      } : null;

      // 이전 4개는 필요한 필드만 추출
      const previous = (allData?.slice(1, 5) || []).map(({ id, created_at, slug, topic }) =>
        ({ id, created_at, slug, topic })
      );

      logger.info('정치 리포트 랜딩 모드 조회 완료 (1 query)', {
        latestCount: latest ? 1 : 0,
        previousCount: previous.length,
        totalCount: totalCountResult || 0
      });

      return res.status(200).json({
        success: true,
        latest,
        previous,
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
