import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { RankingNewsItem, RankingNewsResponse } from '@/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RankingNewsResponse | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      console.log('랭킹 뉴스 API 요청 시작');
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
      console.log('Supabase 쿼리 실행 중...');
      const [countResult, dataResult] = await Promise.all([
        countQuery,
        dataQuery
      ]);
      
      if (countResult.error) {
        console.error('Supabase count 쿼리 오류:', countResult.error);
        throw countResult.error;
      }
      if (dataResult.error) {
        console.error('Supabase data 쿼리 오류:', dataResult.error);
        throw dataResult.error;
      }
      
      let items: RankingNewsItem[] = dataResult.data || [];
      console.log('Supabase 쿼리 결과:', { count: countResult.count, itemCount: items.length });
      
      // 필수 필드가 없는 아이템 제거
      const filteredItems = items.filter(item => 
        item && 
        item.id !== undefined && 
        item.id !== null && 
        item.title && 
        item.link
      );
      
      if (filteredItems.length !== items.length) {
        console.log(`유효하지 않은 항목 ${items.length - filteredItems.length}개 필터링됨`);
      }
      
      // 필드 확인 및 기본값 제공
      items = filteredItems.map(item => ({
        id: item.id,
        title: item.title || '제목 없음',
        link: item.link || '#',
        media_name: item.media_name || '미상',
      }));
      
      // 실제 총 개수
      const totalCount = countResult.count || 0;
      
      // 데이터가 없는 경우 샘플 데이터로 대체
      if (items.length === 0) {
        console.log('랭킹 뉴스 데이터가 없어 샘플 데이터 사용');
        items = generateSampleItems(20);
      }
      
      console.log('랭킹 뉴스 API 응답 완료:', { itemCount: items.length, totalCount });
      res.status(200).json({
        items: items,
        totalCount: totalCount || items.length,
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
  const titles = [
    '코로나19 신규 확진자 감소세 지속',
    '경제 전문가 "내년 경제 성장률 3% 전망"',
    '여야, 예산안 처리 합의 도출',
    '세계 주요국 기후변화 대응 협약 체결',
    '올해 가장 많이 검색된 키워드는?',
    '신형 스마트폰 출시, 첫날 판매량 신기록',
    '국내 첫 AI 반도체 개발 성공',
    '초강력 태풍 북상 중, 내일 영향권'
  ];
  const items: RankingNewsItem[] = [];
  
  for (let i = 1; i <= count; i++) {
    const mediaIndex = i % mediaNames.length;
    const titleIndex = i % titles.length;
    const mediaName = mediaNames[mediaIndex];
    
    items.push({
      id: `ranking-${i}`,
      title: `${titles[titleIndex]} ${i}`,
      link: `https://example.com/ranking/${i}`,
      media_name: mediaName
    });
  }
  
  return items;
} 