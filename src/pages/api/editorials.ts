import { editorialSupabase } from '@/lib/editorialSupabaseClient';
import { createLogger } from '@/utils/logger';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { EditorialAnalysis, EditorialTopic, EditorialArticle } from '@/types';

const logger = createLogger('API:Editorials');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 환경변수 체크
    if (!process.env.NEXT_PUBLIC_EDITORIAL_SUPABASE_URL || !process.env.NEXT_PUBLIC_EDITORIAL_SUPABASE_ANON_KEY) {
      logger.error('사설 Supabase 환경변수 누락');
      return res.status(503).json({
        error: 'Editorial database not configured',
        message: '사설 데이터베이스 환경변수가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.'
      });
    }

    // Edge 캐싱 설정 (5분 캐시, 10분 stale-while-revalidate)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    const { landing } = req.query;

    // 랜딩 페이지 모드: 최신 1개 전체 + 이전 4개 날짜만
    if (landing === 'true') {
      logger.info('사설 분석 랜딩 모드 조회 시작');

      // 전체 개수 먼저 조회
      const { count: totalCountResult } = await editorialSupabase
        .from('news_analysis')
        .select('*', { count: 'exact', head: true });

      // 최신 분석 1개 (전체 데이터 with topics & articles)
      const { data: latestData, error: latestError } = await editorialSupabase
        .from('news_analysis')
        .select(`
          *,
          topics:analysis_topic(
            *,
            articles:analysis_article(*)
          )
        `)
        .order('analyzed_at', { ascending: false })
        .limit(1);

      if (latestError) {
        logger.error('최신 사설 분석 조회 실패', latestError);
        throw latestError;
      }

      // 이전 4개 (id, analyzed_at만)
      const { data: previousData, error: previousError } = await editorialSupabase
        .from('news_analysis')
        .select('id, analyzed_at')
        .order('analyzed_at', { ascending: false })
        .range(1, 4); // 2번째~5번째

      if (previousError) {
        logger.error('이전 사설 분석 조회 실패', previousError);
        throw previousError;
      }

      // 최신 데이터 정렬
      const latest = latestData?.[0] ? {
        ...latestData[0],
        topics: (latestData[0].topics || [])
          .sort((a: any, b: any) => (a.topic_number || 0) - (b.topic_number || 0))
          .map((topic: any) => ({
            ...topic,
            articles: (topic.articles || []).sort((a: any, b: any) => (a.article_number || 0) - (b.article_number || 0))
          }))
      } : null;

      logger.info('사설 분석 랜딩 모드 조회 완료', {
        latestCount: latestData?.length || 0,
        previousCount: previousData?.length || 0,
        totalCount: totalCountResult || 0
      });

      return res.status(200).json({
        latest,
        previous: previousData || [],
        totalCount: totalCountResult || 0
      });
    }

    // 일반 페이지네이션 모드
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;
    const startIndex = (page - 1) * pageSize;

    logger.info('사설 분석 데이터 요청', { page, pageSize, startIndex });

    // JOIN 쿼리로 N+1 문제 해결 (41번 쿼리 → 1번 쿼리)
    // 1번의 쿼리로 analysis + topics + articles 모두 조회
    const { data: analysisData, error: analysisError, count } = await editorialSupabase
      .from('news_analysis')
      .select(`
        *,
        topics:analysis_topic(
          *,
          articles:analysis_article(*)
        )
      `, { count: 'exact' })
      .order('analyzed_at', { ascending: false })
      .range(startIndex, startIndex + pageSize - 1);

    if (analysisError) {
      logger.error('사설 분석 조회 실패', analysisError);
      return res.status(500).json({
        error: 'Failed to fetch editorial analysis',
        details: analysisError.message
      });
    }

    if (!analysisData || analysisData.length === 0) {
      logger.info('사설 분석 데이터 없음');
      return res.status(200).json({
        items: [],
        totalCount: 0
      });
    }

    // topics와 articles를 정렬
    const sortedAnalysis = analysisData.map(analysis => ({
      ...analysis,
      topics: (analysis.topics || [])
        .sort((a: any, b: any) => (a.topic_number || 0) - (b.topic_number || 0))
        .map((topic: any) => ({
          ...topic,
          articles: (topic.articles || []).sort((a: any, b: any) => (a.article_number || 0) - (b.article_number || 0))
        }))
    })) as EditorialAnalysis[];

    logger.info('사설 분석 데이터 조회 완료', {
      page,
      pageSize,
      itemCount: sortedAnalysis.length,
      totalCount: count || 0,
      totalTopics: sortedAnalysis.reduce((sum, a) => sum + (a.topics?.length || 0), 0)
    });

    return res.status(200).json({
      items: sortedAnalysis,
      totalCount: count || 0
    });

  } catch (error) {
    logger.error('사설 분석 API 오류', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
