import { supabase } from '@/lib/supabaseClient';
import { createLogger } from '@/utils/logger';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { BillsReport } from '@/types/bills';

const logger = createLogger('API:Bills');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Edge 캐싱 설정 (5분 캐시, 10분 stale-while-revalidate)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    const { page, pageSize, landing } = req.query;

    // 랜딩 페이지 모드: 최신 1개 전체 + 이전 4개 날짜만
    if (landing === 'true') {
      logger.info('Bills landing mode requested');

      // 🚀 Phase 1.2: 3번의 DB 쿼리 → 1번으로 통합 (count + latest + previous)
      // 최신 5개를 한 번에 조회 후 메모리에서 분리
      const { data: allData, error: queryError, count: totalCountResult } = await supabase
        .from('bills_monitor_reports')
        .select(`
          *,
          bills:bills_monitor_bills(*)
        `, { count: 'exact' })
        .eq('is_published', true)
        .order('report_date', { ascending: false })
        .limit(5);

      if (queryError) {
        logger.error('Failed to fetch bills reports', queryError);
        throw queryError;
      }

      // 메모리에서 최신 1개와 이전 4개로 분리
      const latest = allData?.[0] || null;
      const previous = (allData?.slice(1, 5) || []).map(({ id, report_date, slug }) => ({ id, report_date, slug }));

      logger.info('Landing data fetched (1 query)', {
        latestCount: latest ? 1 : 0,
        previousCount: previous.length,
        totalCount: totalCountResult || 0
      });

      return res.status(200).json({
        latest,
        previous,
        totalCount: totalCountResult || 0
      });
    }

    // 일반 페이지네이션 모드
    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 12;
    const startIndex = (pageNum - 1) * pageSizeNum;

    logger.info('Bills pagination mode', { page: pageNum, pageSize: pageSizeNum });

    // 통합 쿼리 (count + data)
    const { data, error, count } = await supabase
      .from('bills_monitor_reports')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('report_date', { ascending: false })
      .range(startIndex, startIndex + pageSizeNum - 1);

    if (error) {
      logger.error('Failed to fetch bills reports', error);
      throw error;
    }

    logger.info('Bills reports fetched', { count, itemCount: data?.length || 0 });
    res.status(200).json({
      data: data as BillsReport[],
      totalCount: count || 0
    });
  } catch (error: any) {
    logger.error('Error in bills API', error);
    res.status(500).json({ error: error.message || 'Failed to fetch bills reports' });
  }
}
