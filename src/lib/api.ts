import { NewsItem, PaginationParams } from '@/types';
import { supabase } from './supabaseClient';

export async function fetchNewsItems({ page, pageSize, category, searchTerm, dateRange }: PaginationParams) {
  // 1. 전체 데이터 쿼리 준비
  let query = supabase
    .from('news')
    .select('title, original_link, pub_date, category', { count: 'exact' });
    
  // 카테고리 필터 적용
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  // 검색어 필터 적용
  if (searchTerm) {
    query = query.ilike('title', `%${searchTerm}%`);
  }

  // 날짜 범위 필터 적용
  if (dateRange && dateRange[0] && dateRange[1]) {
    const startDate = dateRange[0].toISOString().split('T')[0];
    const endDate = dateRange[1].toISOString().split('T')[0];
    query = query.gte('pub_date', startDate).lte('pub_date', endDate);
  }

  // 2. 날짜 문자열을 파싱하여 정렬
  const { data: allData, error: fetchError } = await query;
  
  if (fetchError) throw new Error(fetchError.message);

  // 날짜 기준으로 정렬
  const sortedData = allData?.sort((a, b) => {
    const dateA = new Date(a.pub_date);
    const dateB = new Date(b.pub_date);
    return dateB.getTime() - dateA.getTime();  // 최신순 정렬
  });

  // 정렬된 데이터 확인
  console.log('Sorted by pub_date (newest first):', 
    sortedData?.map(item => ({
      title: item.title.substring(0, 30) + '...',
      pub_date: item.pub_date,
      category: item.category
    }))
  );

  // 3. 페이지네이션 적용
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData?.slice(startIndex, endIndex) || [];

  return {
    items: paginatedData,
    totalCount: allData?.length || 0,
  };
}

export async function fetchNewsItemById(id: string) {
  const { data, error } = await supabase
    .from('news')  // Changed from 'news_items' to 'news'
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data as NewsItem;
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('news')
    .select('category');
  
  if (error) {
    throw new Error(error.message);
  }
  
  // Fix type inference with proper type assertion
  type CategoryRow = { category: string };
  const categories = (data as CategoryRow[] || []);
const uniqueCategories = Array.from(new Set(categories.map(item => item.category)));
  return uniqueCategories;
}