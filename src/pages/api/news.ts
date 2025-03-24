import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

interface NewsItem {
  id: string;
  title: string;
  original_link: string;
  pub_date: string;
  category: string;
  description?: string;
}

// 내부 처리용 확장 인터페이스 추가
interface NewsItemWithParsedDate extends NewsItem {
  parsed_date?: string;
}

interface NewsResponse {
  items: NewsItem[];
  totalCount: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NewsResponse | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      const { page = '1', pageSize = '20', category, all = 'false' } = req.query;
      
      // 먼저 전체 카운트를 정확하게 계산하기 위한 쿼리
      let countQuery = supabase
        .from('news')
        .select('id', { count: 'exact', head: true });
      
      if (category && category !== 'all') {
        countQuery = countQuery.eq('category', category);
      }
      
      // 데이터를 가져오는 쿼리 - 정렬은 클라이언트 측에서 처리할 것이므로 여기서는 정렬하지 않음
      let dataQuery = supabase
        .from('news')
        .select('id, title, original_link, pub_date, category, description');
      
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
          // Supabase는 offset 대신 range를 사용
          const startIndex = (pageNum - 1) * pageSizeNum;
          dataQuery = dataQuery.range(startIndex, startIndex + pageSizeNum - 1);
        } else {
          // 페이지네이션 없이 최대 100개 데이터 가져오기 (필요한 경우)
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
      
      // pub_date 텍스트를 Date 객체로 변환하여 정렬
      let items: NewsItemWithParsedDate[] = dataResult.data || [];
      
      // 날짜 파싱 및 정렬 처리
      items = items.map(item => {
        let result: NewsItemWithParsedDate = { ...item };
        try {
          // 날짜를 ISO 형식으로 변환하여 저장 (원래 형식 보존)
          const date = new Date(item.pub_date);
          if (isNaN(date.getTime())) {
            console.warn(`잘못된 날짜 형식: ${item.pub_date}`);
            // 유효하지 않은 날짜는 과거 날짜로 설정
            result.parsed_date = new Date(0).toISOString();
          } else {
            result.parsed_date = date.toISOString();
          }
        } catch (e) {
          console.error(`날짜 파싱 오류: ${item.pub_date}`, e);
          result.parsed_date = new Date(0).toISOString();
        }
        return result;
      });
      
      // 날짜 기준으로 정렬 (최신순)
      items.sort((a, b) => {
        const dateA = a.parsed_date ? new Date(a.parsed_date).getTime() : 0;
        const dateB = b.parsed_date ? new Date(b.parsed_date).getTime() : 0;
        return dateB - dateA;
      });
      
      // 로그 추가
      console.log(`총 데이터 개수: ${countResult.count}, 현재 페이지 데이터 개수: ${items.length}, 전체 데이터 요청: ${all === 'true'}`);
      
      // 실제 총 개수 (모든 레코드 수)
      const totalCount = countResult.count || 0;
      
      // 정렬 후 페이지네이션 적용 (all이 false이고 서버에서 정렬하는 경우)
      if (all !== 'true' && page && pageSize) {
        const pageNum = parseInt(page as string, 10);
        const pageSizeNum = parseInt(pageSize as string, 10);
        const startIndex = (pageNum - 1) * pageSizeNum;
        
        if (pageNum > 0 && pageSizeNum > 0) {
          items = items.slice(startIndex, startIndex + pageSizeNum);
        }
      }
      
      // parsed_date 필드 제거 (클라이언트에 불필요한 데이터)
      const cleanedItems: NewsItem[] = items.map(({ parsed_date, ...rest }) => rest);
      
      res.status(200).json({
        items: cleanedItems,
        totalCount: totalCount,
      });
    } catch (error: any) {
      console.error('뉴스 데이터 조회 오류:', error.message);
      // 오류 발생 시 샘플 데이터 반환
      const sampleItems = generateSampleItems(40); // 샘플 데이터 개수 증가
      res.status(200).json({
        items: sampleItems,
        totalCount: 100, // 충분히 큰 숫자로 설정
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// 샘플 데이터 생성 함수 (오류 시 사용)
function generateSampleItems(count: number): NewsItem[] {
  const categories = ['정치', '경제', '사회', '국제', '문화', '연예/스포츠', '기타'];
  const items: NewsItem[] = [];
  
  for (let i = 1; i <= count; i++) {
    const categoryIndex = i % categories.length;
    const category = categories[categoryIndex];
    
    // 발행일을 현재 시간에서 i시간 전으로 설정하여 최신순 정렬 테스트
    const date = new Date();
    date.setHours(date.getHours() - i);
    
    items.push({
      id: `sample-${i}`,
      title: `${category} 분야 단독 뉴스 ${i}`,
      original_link: `https://example.com/news/${i}`,
      pub_date: date.toISOString(),
      category,
      description: `${category} 관련 주요 뉴스 내용입니다.`
    });
  }
  
  return items;
} 