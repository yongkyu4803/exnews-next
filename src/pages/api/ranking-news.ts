import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { RankingNewsItem, RankingNewsResponse } from '@/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RankingNewsResponse | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      const { page = '1', pageSize = '20', all = 'false' } = req.query;
      
      // 먼저 전체 카운트를 계산하기 위한 쿼리
      let countQuery = supabase
        .from('ranking_news')
        .select('id', { count: 'exact', head: true });
      
      // 데이터를 가져오는 쿼리
      let dataQuery = supabase
        .from('ranking_news')
        .select('id, title, link, media_name');
      
      // all 파라미터가 'true'인 경우 모든 데이터 가져오기
      if (all === 'true') {
        // 전체 데이터 가져오기 (최대 1000개)
        dataQuery = dataQuery.limit(1000);
      } else {
        // 일반 페이지네이션 적용
        const pageNum = parseInt(page as string, 10);
        const pageSizeNum = parseInt(pageSize as string, 10);
        
        // 페이지네이션 설정
        if (pageNum > 0 && pageSizeNum > 0) {
          dataQuery = dataQuery.limit(pageSizeNum);
          const startIndex = (pageNum - 1) * pageSizeNum;
          dataQuery = dataQuery.range(startIndex, startIndex + pageSizeNum - 1);
        } else {
          // 페이지네이션 없이 최대 100개 데이터 가져오기
          dataQuery = dataQuery.limit(100);
        }
      }
      
      // 두 쿼리 동시 실행
      const [countResult, dataResult] = await Promise.all([
        countQuery,
        dataQuery
      ]);
      
      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;
      
      let items: RankingNewsItem[] = dataResult.data || [];
      
      // 필수 필드가 없는 아이템 제거
      items = items.filter(item => 
        item && 
        item.id !== undefined && 
        item.id !== null && 
        item.title && 
        item.link
      );
      
      // 필드 확인 및 기본값 제공
      items = items.map(item => ({
        id: item.id,
        title: item.title || '제목 없음',
        link: item.link || '#',
        media_name: item.media_name || '미상',
      }));
      
      // 실제 총 개수
      const totalCount = countResult.count || 0;
      
      res.status(200).json({
        items: items,
        totalCount: totalCount,
      });
    } catch (error: any) {
      console.error('랭킹 뉴스 데이터 조회 오류:', error.message);
      // 오류 발생 시 샘플 데이터 반환
      const sampleItems = generateSampleItems(20);
      res.status(200).json({
        items: sampleItems,
        totalCount: 100,
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// 샘플 데이터 생성 함수 (오류 시 사용)
function generateSampleItems(count: number): RankingNewsItem[] {
  const mediaNames = ['조선일보', '중앙일보', '동아일보', '한겨레', 'SBS', 'MBC', 'KBS', '연합뉴스'];
  const items: RankingNewsItem[] = [];
  
  for (let i = 1; i <= count; i++) {
    const mediaIndex = i % mediaNames.length;
    const mediaName = mediaNames[mediaIndex];
    
    items.push({
      id: `ranking-${i}`,
      title: `랭킹 뉴스 ${i}: 주요 이슈에 대한 최신 소식`,
      link: `https://example.com/ranking/${i}`,
      media_name: mediaName
    });
  }
  
  return items;
} 