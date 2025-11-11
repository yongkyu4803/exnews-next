import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { NewsItem, NewsResponse } from '@/types'
import { createLogger } from '@/utils/logger'
import { extractMediaName } from '@/utils/mediaExtractor'

const logger = createLogger('API:News')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NewsResponse | { error: string }>
) {
  // Set cache headers for better performance
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'GET') {
    try {
      const { page = '1', pageSize = '20', category, all = 'false' } = req.query;
      
      // 데이터를 가져오는 쿼리
      let dataQuery = supabase
        .from('news')
        .select('*', { count: 'exact' });
      
      if (category && category !== 'all') {
        dataQuery = dataQuery.eq('category', category);
      }
      
      // all 파라미터가 'true'인 경우 모든 데이터 가져오기
      if (all === 'true') {
        // 전체 데이터 가져오기 (제한 없음)
        const { data, error, count } = await dataQuery;

        if (error) throw error;

        // 날짜 기준으로 정렬 (최신순)
        const sortedData = data?.sort((a, b) =>
          new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime()
        ) || [];

        // original_link에서 미디어명 추출
        const itemsWithMedia = sortedData.map(item => ({
          ...item,
          media_name: extractMediaName(item.original_link)
        }));

        res.status(200).json({
          items: itemsWithMedia,
          totalCount: count || 0,
        });
      } else {
        // 일반 페이지네이션 적용
        const pageNum = parseInt(page as string, 10);
        const pageSizeNum = parseInt(pageSize as string, 10);

        if (pageNum > 0 && pageSizeNum > 0) {
          const startIndex = (pageNum - 1) * pageSizeNum;
          const { data, error, count } = await dataQuery
            .order('pub_date', { ascending: false })
            .range(startIndex, startIndex + pageSizeNum - 1);

          if (error) throw error;

          // original_link에서 미디어명 추출
          const itemsWithMedia = (data || []).map(item => ({
            ...item,
            media_name: extractMediaName(item.original_link)
          }));

          res.status(200).json({
            items: itemsWithMedia,
            totalCount: count || 0,
          });
        } else {
          res.status(400).json({ error: '잘못된 페이지 또는 페이지 크기입니다.' });
        }
      }
    } catch (error) {
      logger.error('뉴스 데이터 조회 오류', error);
      res.status(500).json({ error: '데이터 조회 중 오류가 발생했습니다.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 