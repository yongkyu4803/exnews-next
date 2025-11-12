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

      // 전체 개수 먼저 조회
      const { count: totalCountResult } = await supabase
        .from('bills_monitor_reports')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      // 최신 리포트 1개 (전체 데이터)
      const { data: latestData, error: latestError } = await supabase
        .from('bills_monitor_reports')
        .select('*')
        .eq('is_published', true)
        .order('report_date', { ascending: false })
        .limit(1);

      if (latestError) {
        logger.error('Failed to fetch latest bill report', latestError);
        throw latestError;
      }

      // 이전 4개 (id, report_date, slug만)
      const { data: previousData, error: previousError } = await supabase
        .from('bills_monitor_reports')
        .select('id, report_date, slug')
        .eq('is_published', true)
        .order('report_date', { ascending: false })
        .range(1, 4); // 2번째~5번째 (인덱스 1~4)

      if (previousError) {
        logger.error('Failed to fetch previous bill reports', previousError);
        throw previousError;
      }

      logger.info('Landing data fetched', {
        latestCount: latestData?.length || 0,
        previousCount: previousData?.length || 0,
        totalCount: totalCountResult || 0
      });

      return res.status(200).json({
        latest: latestData?.[0] || null,
        previous: previousData || [],
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
