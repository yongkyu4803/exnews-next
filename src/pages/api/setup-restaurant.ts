import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

// 테이블 생성 및 샘플 데이터 삽입을 위한 API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  try {
    console.log('식당 테이블 설정 API 시작');

    // 테이블 존재 여부 확인 (현재 Supabase API는 직접적인 테이블 생성을 지원하지 않음)
    // 테이블이 존재하는지 확인하는 방법은 테이블에서 데이터를 가져와보는 것
    const { error: checkError } = await supabase
      .from('na-res')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    console.log('테이블 확인 결과:', checkError ? '테이블 없음' : '테이블 존재함');

    if (checkError) {
      console.log('테이블이 없습니다. Supabase 대시보드에서 테이블을 생성해야 합니다.');
      console.log('다음 SQL을 실행하세요:');
      console.log(`
        CREATE TABLE "na-res" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          category TEXT,
          name TEXT NOT NULL,
          location TEXT NOT NULL,
          pnum TEXT,
          price TEXT,
          remark TEXT,
          link TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      return res.status(400).json({ 
        error: '테이블이 존재하지 않습니다. Supabase 대시보드에서 테이블을 생성해야 합니다.', 
        tableExists: false 
      });
    }

    // 샘플 데이터 생성
    const sampleData = [
      {
        category: '한식',
        name: '국회 식당',
        location: '서울시 영등포구 의사당대로 1',
        pnum: '02-123-4567',
        price: '10,000원~15,000원',
        remark: '의원들이 자주 찾는 곳',
        link: 'https://example.com/konghoefood'
      },
      {
        category: '중식',
        name: '여의도 반점',
        location: '서울시 영등포구 국제금융로 7길 16',
        pnum: '02-789-4561',
        price: '8,000원~20,000원',
        remark: '중식 전문점, 짜장면 맛집',
        link: ''
      },
      {
        category: '일식',
        name: '사쿠라 스시',
        location: '서울시 영등포구 의사당로 13',
        pnum: '02-555-7890',
        price: '15,000원~40,000원',
        remark: '신선한 회와 스시',
        link: 'https://example.com/sakura'
      },
      {
        category: '양식',
        name: '파스타 하우스',
        location: '서울시 영등포구 여의도동 23-8',
        pnum: '02-332-1234',
        price: '12,000원~25,000원',
        remark: '파스타 전문점',
        link: ''
      },
      {
        category: '분식',
        name: '여의도 떡볶이',
        location: '서울시 영등포구 여의대방로 375',
        pnum: '02-928-5678',
        price: '5,000원~10,000원',
        remark: '30년 전통의 떡볶이집',
        link: 'https://example.com/tteokbokki'
      }
    ];

    // 기존 데이터 확인
    const { data: existingData, error: countError } = await supabase
      .from('na-res')
      .select('id', { count: 'exact' });
    
    const existingCount = existingData?.length || 0;
    console.log('기존 데이터 수:', existingCount);

    if (existingCount > 0) {
      return res.status(200).json({ 
        message: `테이블이 이미 생성되어 있고, ${existingCount}개의 데이터가 있습니다.`, 
        tableExists: true, 
        dataCount: existingCount 
      });
    }

    // 데이터 삽입
    const { data, error } = await supabase
      .from('na-res')
      .insert(sampleData)
      .select();

    if (error) {
      console.error('데이터 삽입 오류:', error);
      return res.status(500).json({ error: `데이터 삽입 오류: ${error.message}` });
    }

    console.log('샘플 데이터 삽입 성공:', data?.length || 0, '개');
    
    return res.status(200).json({ 
      message: '테이블 설정 완료 및 샘플 데이터 삽입 성공', 
      insertedCount: data?.length || 0,
      success: true
    });

  } catch (error: any) {
    console.error('처리 중 오류 발생:', error);
    return res.status(500).json({ error: error.message || '알 수 없는 오류' });
  }
} 