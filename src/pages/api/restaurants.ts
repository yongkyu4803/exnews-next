import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { RestaurantItem, RestaurantResponse } from '@/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RestaurantResponse | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      console.log('식당 정보 API 요청 시작');
      const { page = '1', pageSize = '20', category, all = 'false' } = req.query;
      
      // Supabase 연결 확인
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '설정되지 않음');
      
      // 먼저 전체 카운트를 계산하기 위한 쿼리
      let countQuery = supabase
        .from('na-res')
        .select('id', { count: 'exact', head: true });
      
      if (category && category !== 'all') {
        countQuery = countQuery.eq('category', category);
      }
      
      // 데이터를 가져오는 쿼리
      let dataQuery = supabase
        .from('na-res')
        .select('id, category, name, location, pnum, price, remark, link');
      
      if (category && category !== 'all') {
        dataQuery = dataQuery.eq('category', category);
      }
      
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
      console.log('Supabase 쿼리 실행 중... 테이블: na-res');
      const [countResult, dataResult] = await Promise.all([
        countQuery,
        dataQuery
      ]);
      
      console.log('카운트 결과:', countResult);
      console.log('데이터 결과:', { 
        status: dataResult.status, 
        error: dataResult.error, 
        count: dataResult.data?.length 
      });
      
      if (countResult.error) {
        console.error('Supabase count 쿼리 오류:', countResult.error);
        if (countResult.error.code === 'PGRST116') {
          console.error('테이블이 존재하지 않습니다. na-res 테이블을 생성해야 합니다.');
        }
        throw countResult.error;
      }
      if (dataResult.error) {
        console.error('Supabase data 쿼리 오류:', dataResult.error);
        throw dataResult.error;
      }
      
      let items: RestaurantItem[] = dataResult.data || [];
      console.log('Supabase 쿼리 결과:', { count: countResult.count, itemCount: items.length });
      
      // 필수 필드가 없는 아이템 제거
      const filteredItems = items.filter(item => 
        item && 
        item.id !== undefined && 
        item.id !== null && 
        item.name && 
        item.location
      );
      
      if (filteredItems.length !== items.length) {
        console.log(`유효하지 않은 항목 ${items.length - filteredItems.length}개 필터링됨`);
      }
      
      // 필드 확인 및 기본값 제공
      items = filteredItems.map(item => ({
        id: item.id,
        category: item.category || '기타',
        name: item.name || '이름 없음',
        location: item.location || '위치 정보 없음',
        pnum: item.pnum || '전화번호 정보 없음',
        price: item.price || '가격 정보 없음',
        remark: item.remark || '',
        link: item.link || '',
      }));
      
      // 실제 총 개수
      const totalCount = countResult.count || 0;
      
      // 데이터가 없는 경우 샘플 데이터로 대체
      if (items.length === 0) {
        console.log('식당 데이터가 없어 샘플 데이터 사용');
        items = generateSampleItems(5);
      }
      
      console.log('식당 정보 API 응답 완료:', { itemCount: items.length, totalCount });
      res.status(200).json({
        items: items,
        totalCount: totalCount || items.length,
      });
    } catch (error: any) {
      console.error('식당 정보 API 오류:', error);
      res.status(500).json({ error: error.message || '서버 오류' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// 샘플 데이터 생성 함수
function generateSampleItems(count: number): RestaurantItem[] {
  const categories = ['한식', '양식', '중식', '일식', '분식'];
  const items: RestaurantItem[] = [];
  
  for (let i = 0; i < count; i++) {
    items.push({
      id: `sample-${i+1}`,
      category: categories[i % categories.length],
      name: `샘플 식당 ${i+1}`,
      location: `서울시 영등포구 여의도동 ${i+1}`,
      pnum: `02-123-456${i}`,
      price: `${(i+1) * 10000}원`,
      remark: i % 2 === 0 ? '점심 특선 메뉴 있음' : '',
      link: i % 3 === 0 ? 'https://example.com' : '',
    });
  }
  
  return items;
} 