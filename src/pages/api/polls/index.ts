import { supabase } from '@/lib/supabaseClient';
import { createLogger } from '@/utils/logger';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { WeeklyPollReport, WeeklyPollPolitics, WeeklyPollEconomy, WeeklyPollResponse } from '@/types/poll';

const logger = createLogger('API:Polls');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Edge 캐싱 설정 (5분 캐시, 10분 stale-while-revalidate)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    const { landing, week, source } = req.query;

    // 랜딩 페이지 모드: 가장 최근 정치 여론조사 1개만
    if (landing === 'true') {
      logger.info('여론조사 랜딩 모드 조회 시작', { source });

      // 가장 최근 정치 여론조사 1개 조회 (publish_date 기준 최신)
      let query = supabase
        .from('weekly_poll_politics')
        .select('*');

      // source 파라미터가 있으면 필터링
      if (source && typeof source === 'string') {
        query = query.eq('source', source);
      }

      const { data: latestPoll, error: latestPollError } = await query
        .order('publish_date', { ascending: false })
        .limit(1);

      if (latestPollError) {
        logger.error('최신 정치 여론조사 조회 실패', latestPollError);
        throw latestPollError;
      }

      if (!latestPoll || latestPoll.length === 0) {
        logger.info('정치 여론조사 데이터 없음', { source });
        return res.status(200).json({
          latest: null
        });
      }

      logger.info('여론조사 랜딩 모드 조회 완료', {
        source: latestPoll[0].source,
        publishDate: latestPoll[0].publish_date,
        week: latestPoll[0].week
      });

      return res.status(200).json({
        latest: latestPoll[0] as WeeklyPollPolitics
      });
    }

    // 특정 주차 조회
    if (week) {
      logger.info('특정 주차 여론조사 조회', { week });

      // 해당 주차 리포트 조회
      const { data: reportData, error: reportError } = await supabase
        .from('weekly_poll_reports')
        .select('*')
        .eq('week', week)
        .single();

      if (reportError) {
        if (reportError.code === 'PGRST116') {
          logger.info('해당 주차 여론조사 데이터 없음', { week });
          return res.status(404).json({ error: 'Poll data not found for the specified week' });
        }
        logger.error('여론조사 리포트 조회 실패', reportError);
        throw reportError;
      }

      // 정치 여론조사 데이터 조회
      const { data: politicsData, error: politicsError } = await supabase
        .from('weekly_poll_politics')
        .select('*')
        .eq('week', week)
        .order('source', { ascending: true });

      if (politicsError) {
        logger.error('정치 여론조사 데이터 조회 실패', politicsError);
        throw politicsError;
      }

      // 경제 지표 데이터 조회
      const { data: economyData, error: economyError } = await supabase
        .from('weekly_poll_economy')
        .select('*')
        .eq('week', week)
        .order('indicator', { ascending: true });

      if (economyError) {
        logger.error('경제 지표 데이터 조회 실패', economyError);
        throw economyError;
      }

      const result: WeeklyPollResponse = {
        report: reportData as WeeklyPollReport,
        politics: (politicsData || []) as WeeklyPollPolitics[],
        economy: (economyData || []) as WeeklyPollEconomy[]
      };

      logger.info('특정 주차 여론조사 조회 완료', {
        week,
        politicsCount: politicsData?.length || 0,
        economyCount: economyData?.length || 0
      });

      return res.status(200).json(result);
    }

    // 일반 페이지네이션 모드
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;
    const startIndex = (page - 1) * pageSize;

    logger.info('여론조사 데이터 요청', { page, pageSize, startIndex });

    // 리포트 목록 조회 (페이지네이션)
    const { data: reportsData, error: reportsError, count } = await supabase
      .from('weekly_poll_reports')
      .select('*', { count: 'exact' })
      .order('week', { ascending: false })
      .range(startIndex, startIndex + pageSize - 1);

    if (reportsError) {
      logger.error('여론조사 리포트 조회 실패', reportsError);
      return res.status(500).json({
        error: 'Failed to fetch poll reports',
        details: reportsError.message
      });
    }

    if (!reportsData || reportsData.length === 0) {
      logger.info('여론조사 데이터 없음');
      return res.status(200).json({
        items: [],
        totalCount: 0
      });
    }

    logger.info('여론조사 데이터 조회 완료', {
      page,
      pageSize,
      itemCount: reportsData.length,
      totalCount: count || 0
    });

    return res.status(200).json({
      items: reportsData as WeeklyPollReport[],
      totalCount: count || 0
    });

  } catch (error) {
    logger.error('여론조사 API 오류', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
