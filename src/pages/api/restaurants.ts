import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { RestaurantItem, RestaurantResponse } from '@/types'

// 확장된 응답 타입
interface ExtendedRestaurantResponse extends RestaurantResponse {
  error?: string;
  debug?: any;
  source?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedRestaurantResponse | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      // Edge 캐싱 설정 (5분 캐시, 10분 stale-while-revalidate)
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

      console.log('식당 정보 API 요청 시작 - 클라이언트 IP:', req.headers['x-forwarded-for'] || req.socket.remoteAddress);
      console.log('쿼리 파라미터:', req.query);
      const { page = '1', pageSize = '20', category, all = 'false' } = req.query;
      
      // Supabase 연결 확인
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '설정되지 않음');
      
      // 항상 샘플 데이터 반환 (디버깅 용도)
      if (req.query.debug === 'sample') {
        console.log('디버그 모드: 샘플 데이터 반환');
        const sampleData = generateSampleItems(5);
        res.status(200).json({
          items: sampleData,
          totalCount: sampleData.length,
          source: 'sample-debug'
        });
        return;
      }
      
      // 페이지네이션 파라미터 파싱
      const pageNum = parseInt(page as string, 10);
      const pageSizeNum = parseInt(pageSize as string, 10);

      // 통합 쿼리: count + data를 한 번에 조회
      console.log('Supabase 통합 쿼리 시작... 테이블: nares');

      let query = supabase
        .from('nares')
        .select('id, category, name, location, building_name, pnum, price, remark, link', { count: 'exact' })
        .not('name', 'is', null)
        .not('location', 'is', null);

      // 카테고리 필터 적용
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      // all 파라미터가 'true'인 경우 모든 데이터 가져오기
      if (all === 'true') {
        query = query.limit(1000);
      } else if (pageNum > 0 && pageSizeNum > 0) {
        // 일반 페이지네이션 적용
        const startIndex = (pageNum - 1) * pageSizeNum;
        query = query.range(startIndex, startIndex + pageSizeNum - 1);
      } else {
        // 페이지네이션 없이 최대 100개 데이터 가져오기
        query = query.limit(100);
      }

      // 단일 쿼리 실행 (count + data 동시 조회)
      const { data, error, count } = await query;

      console.log('Supabase 쿼리 결과:', {
        count: count,
        itemCount: data?.length
      });

      // 오류 처리를 위한 플래그
      let useBackupData = false;
      let errorDetails = null;

      if (error) {
        console.error('Supabase 쿼리 오류:', error);
        errorDetails = error;

        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.error('테이블이 존재하지 않습니다. nares 테이블을 생성해야 합니다.');
          useBackupData = true;
        } else {
          throw error;
        }
      }

      let items: RestaurantItem[] = [];
      let totalCount = 0;

      if (!useBackupData) {
        items = data || [];
        totalCount = count || 0;
      }
      
      console.log('Supabase 쿼리 결과:', {
        count: totalCount,
        itemCount: items.length,
        useBackupData
      });

      // 기본값 제공 (DB에서 이미 null 필터링 완료)
      items = items.map(item => ({
        id: item.id,
        category: item.category || '기타',
        name: item.name,
        location: item.location,
        building_name: item.building_name || undefined,
        pnum: item.pnum || '전화번호 정보 없음',
        price: item.price || '가격 정보 없음',
        remark: item.remark || '',
        link: item.link || '',
      }));
      
      // 데이터가 없는 경우 샘플 데이터로 대체
      if (items.length === 0 || useBackupData) {
        console.log('식당 데이터가 없거나 테이블 접근 오류로 샘플 데이터 사용');
        items = generateSampleItems(5);
      }
      
      // 응답 준비
      const responseData: ExtendedRestaurantResponse = {
        items: items,
        totalCount: totalCount || items.length,
      };
      
      // 디버그 정보 추가
      if (useBackupData || errorDetails) {
        responseData.debug = {
          useBackupData,
          errorDetails,
          source: 'sample-fallback'
        };
      }
      
      console.log('식당 정보 API 응답 완료:', { 
        itemCount: items.length, 
        totalCount: responseData.totalCount,
        isBackupData: useBackupData
      });
      
      res.status(200).json(responseData);
    } catch (error: any) {
      console.error('식당 정보 API 오류:', error);
      
      // 오류가 발생했지만 실패하지 않도록 샘플 데이터 반환
      const sampleData = generateSampleItems(5);
      res.status(200).json({
        items: sampleData,
        totalCount: sampleData.length,
        error: error.message || '서버 오류',
        source: 'sample-error'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// 샘플 데이터 생성 함수
function generateSampleItems(count: number): RestaurantItem[] {
  const categories = ['한식', '양식', '중식', '일식', '분식'];
  const buildings = ['샘플빌딩', '테스트센터', '개발타워', '코딩빌딩', '프로그래밍센터'];
  const items: RestaurantItem[] = [];
  
  for (let i = 0; i < count; i++) {
    items.push({
      id: `sample-${i+1}`,
      category: categories[i % categories.length],
      name: `샘플 식당 ${i+1}`,
      location: `서울시 영등포구 여의도동 ${buildings[i % buildings.length]} B1`,
      building_name: buildings[i % buildings.length],
      pnum: `02-123-456${i}`,
      price: `${(i+1) * 10000}원`,
      remark: i % 2 === 0 ? '점심 특선 메뉴 있음' : '',
      link: i % 3 === 0 ? 'https://example.com' : '',
    });
  }
  
  return items;
} 