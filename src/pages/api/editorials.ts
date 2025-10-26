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
    logger.info('사설 분석 데이터 요청 시작');

    // 1. news_analysis 테이블에서 사설 분석 목록 조회
    // Note: analysis_type 컬럼이 없으므로 모든 데이터 조회
    const { data: analysisData, error: analysisError } = await editorialSupabase
      .from('news_analysis')
      .select('*')
      .order('analyzed_at', { ascending: false });

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

    logger.info('사설 분석 기본 데이터 조회 완료', { count: analysisData.length });

    // 2. 각 분석에 대한 주제(topics) 및 기사(articles) 조회
    const analysisWithTopics = await Promise.all(
      analysisData.map(async (analysis) => {
        // 주제 조회
        const { data: topicsData, error: topicsError } = await editorialSupabase
          .from('analysis_topic')
          .select('*')
          .eq('analysis_id', analysis.id)
          .order('topic_number', { ascending: true });

        if (topicsError) {
          logger.error('주제 조회 실패', { analysisId: analysis.id, error: topicsError });
          return {
            ...analysis,
            topics: []
          };
        }

        // 각 주제에 대한 기사 조회
        const topicsWithArticles = await Promise.all(
          (topicsData || []).map(async (topic) => {
            const { data: articlesData, error: articlesError } = await editorialSupabase
              .from('analysis_article')
              .select('*')
              .eq('topic_id', topic.id)
              .order('article_number', { ascending: true });

            if (articlesError) {
              logger.error('기사 조회 실패', { topicId: topic.id, error: articlesError });
              return {
                ...topic,
                articles: []
              };
            }

            return {
              ...topic,
              articles: articlesData || []
            } as EditorialTopic;
          })
        );

        return {
          ...analysis,
          topics: topicsWithArticles
        } as EditorialAnalysis;
      })
    );

    logger.info('사설 분석 데이터 처리 완료', {
      count: analysisWithTopics.length,
      totalTopics: analysisWithTopics.reduce((sum, a) => sum + (a.topics?.length || 0), 0)
    });

    return res.status(200).json({
      items: analysisWithTopics,
      totalCount: analysisWithTopics.length
    });

  } catch (error) {
    logger.error('사설 분석 API 오류', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
