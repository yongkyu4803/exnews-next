import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useQuery } from 'react-query';
import { Typography, Row, Col, Spin, Alert, Space, Select, Input, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { RestaurantItem, RestaurantResponse } from '@/types';

// 컴포넌트 동적 로딩
const RestaurantTable = dynamic(() => import('@/components/RestaurantTable'), {
  ssr: false,
  loading: () => <div style={{ padding: '20px 0', textAlign: 'center' }}><Spin size="large" tip="테이블 로딩 중..." /></div>
});

const { Title, Text } = Typography;
const { Option } = Select;

// 식당 정보 가져오기
const fetchRestaurants = async ({ 
  page = 1, 
  pageSize = 20, 
  category, 
  all = false 
}: { 
  page?: number; 
  pageSize?: number; 
  category?: string; 
  all?: boolean; 
}): Promise<RestaurantResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());
  if (category && category !== 'all') {
    params.append('category', category);
  }
  if (all) {
    params.append('all', 'true');
  }

  const url = `/api/restaurants?${params.toString()}`;
  console.log('식당 정보 요청 URL:', url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('식당 정보를 불러오는데 실패했습니다');
  }
  return response.json();
};

export default function RestaurantsPage() {
  // 상태 관리
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRows, setSelectedRows] = useState<RestaurantItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);

  // 식당 정보 쿼리
  const { data, error, isLoading, refetch } = useQuery(
    ['restaurants', page, pageSize, selectedCategory, searching ? searchTerm : ''],
    () => fetchRestaurants({ 
      page, 
      pageSize, 
      category: selectedCategory === 'all' ? undefined : selectedCategory
    }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5분 캐싱
      refetchOnWindowFocus: false
    }
  );

  // 카테고리 옵션
  const categories = ['한식', '양식', '중식', '일식', '분식', '기타'];

  // 선택 변경 핸들러
  const handleSelectChange = (keys: React.Key[], rows: RestaurantItem[]) => {
    setSelectedRows(rows);
  };

  // 검색 핸들러
  const handleSearch = () => {
    setSearching(true);
    setPage(1);
    refetch();
  };

  // 페이지네이션 처리
  const handleTableChange = (pagination: any) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // 필터링된 데이터 적용
  const filteredItems = data?.items.filter(item => {
    if (!searchTerm) return true;
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.remark && item.remark.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }) || [];

  return (
    <>
      <Head>
        <title>국회앞 식당 | 식당 정보</title>
        <meta name="description" content="국회앞 식당 정보 목록" />
      </Head>

      <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>국회앞 식당</Title>
        
        {/* 필터 및 검색 바 */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={8} md={6} lg={5}>
            <Select
              value={selectedCategory}
              onChange={(value) => { setSelectedCategory(value); setPage(1); }}
              style={{ width: '100%' }}
            >
              <Option value="all">전체 카테고리</Option>
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={16} md={18} lg={19}>
            <Space style={{ width: '100%' }}>
              <Input
                placeholder="식당명, 위치 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onPressEnter={handleSearch}
                style={{ flex: 1 }}
              />
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={handleSearch}
              >
                검색
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 오류 처리 */}
        {error && (
          <Alert
            message="데이터 로딩 오류"
            description={error instanceof Error ? error.message : '식당 정보를 불러오는데 실패했습니다.'}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* 데이터 테이블 */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="식당 정보 불러오는 중..." />
          </div>
        ) : (
          <>
            <Text style={{ marginBottom: '8px', display: 'block' }}>
              총 {filteredItems.length}개의 식당 정보
            </Text>
            <RestaurantTable
              items={filteredItems}
              selectedKeys={selectedRows.map(r => r.id || r.name)}
              onSelectChange={handleSelectChange}
              loading={isLoading}
            />
          </>
        )}
      </div>
    </>
  );
}

// SSR 설정
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {} // 초기 props 전달
  };
}; 