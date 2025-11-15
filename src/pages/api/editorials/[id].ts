import { editorialSupabase } from '@/lib/editorialSupabaseClient';
import { createLogger } from '@/utils/logger';
import type { NextApiRequest, NextApiResponse } from 'next';

const logger = createLogger('API:Editorials:Detail');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    logger.info('사설 분석 상세 조회 시작', { id });

    // JOIN 쿼리로 analysis + topics + articles 모두 조회
    const { data, error } = await editorialSupabase
      .from('news_analysis')
      .select(`
        *,
        topics:analysis_topic(
          *,
          articles:analysis_article(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn('사설 분석을 찾을 수 없음', { id });
        return res.status(404).json({ error: 'Editorial not found' });
      }

      logger.error('Supabase 조회 실패', error);
      throw error;
    }

    // topics와 articles를 정렬하고 필드명을 camelCase로 변환
    const sortedData = {
      ...data,
      topics: (data.topics || [])
        .sort((a: any, b: any) => (a.topic_number || 0) - (b.topic_number || 0))
        .map((topic: any) => ({
          topic_number: topic.topic_number,
          title: topic.topic_title,
          summary: topic.topic_summary,
          articles: (topic.articles || [])
            .sort((a: any, b: any) => (a.article_number || 0) - (b.article_number || 0))
            .map((article: any) => ({
              article_number: article.article_number,
              title: article.title,
              newspaper: article.media,
              published_date: article.pubdate,
              summary: article.summary,
              link: article.link
            }))
        }))
    };

    logger.info('사설 분석 상세 조회 완료', {
      id,
      topicCount: sortedData.topics?.length || 0,
      articleCount: sortedData.topics?.reduce((sum: number, topic: any) => sum + (topic.articles?.length || 0), 0) || 0
    });

    return res.status(200).json(sortedData);

  } catch (error: any) {
    logger.error('사설 분석 상세 조회 실패', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    });
  }
}
