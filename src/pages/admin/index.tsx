import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { fetchNewsItems, fetchCategories } from '@/lib/api';
import SearchBar from '@/components/Admin/SearchBar';
import Filters from '@/components/Admin/Filters';
import { NewsItem } from '@/types';

// 동적 임포트
const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false }) as any;
const Space = dynamic(() => import('antd/lib/space'), { ssr: false }) as any;
const Spin = dynamic(() => import('antd/lib/spin'), { ssr: false }) as any;
const Alert = dynamic(() => import('antd/lib/alert'), { ssr: false }) as any;
const Table = dynamic(() => import('antd/lib/table'), { ssr: false }) as any;
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;

const { Title } = Typography;

// Keep the helper function
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '알 수 없는 오류가 발생했습니다.';
};

// Define response types for better type safety
interface NewsItemsResponse {
  items: any[];
  totalCount: number;
}

export default function AdminPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  // 카테고리 목록 가져오기
  // Add proper type annotations to useQuery calls
  const { data: categories = [], isLoading: isCategoriesLoading, error: categoriesError } = 
    useQuery<string[], Error>('categories', fetchCategories);

  const { data, isLoading, error } = useQuery<NewsItemsResponse, Error>(
    ['adminNewsItems', page, pageSize, searchTerm, selectedCategory, dateRange],
    () => fetchNewsItems({ 
      page, 
      pageSize, 
      category: selectedCategory,
      searchTerm,
      dateRange
    }),
    {
      keepPreviousData: true,
    }
  );

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category || undefined);
    setPage(1);
  };

  const handleDateFilter = (dates: [Date | null, Date | null]) => {
    setDateRange(dates);
    setPage(1);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>관리자 대시보드</Title>
      
      <div style={{ marginBottom: '16px' }}>
        <SearchBar onSearch={handleSearch} />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <Filters
          categories={categories}
          onCategoryFilter={handleCategoryFilter}
          onDateFilter={handleDateFilter}
        />
      </div>

      {error && (
        <Alert
          message="데이터 로딩 오류"
          description={getErrorMessage(error)}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
      
      <Table 
        columns={[
          { 
            title: 'ID',
            dataIndex: 'id',
            width: 80,
          },
          { 
            title: '제목',
            dataIndex: 'title',
            render: (text: string, record: NewsItem) => (
              <a href={record.original_link} target="_blank" rel="noopener noreferrer">
                {text}
              </a>
            )
          },
          { 
            title: '카테고리',
            dataIndex: 'category',
            width: 120,
          },
          { 
            title: '발행일',
            dataIndex: 'pub_date',
            width: 200,
            render: (date: string) => new Date(date).toLocaleString('ko-KR')
          },
          {
            title: '작업',
            key: 'action',
            width: 120,
            render: (_: unknown, record: NewsItem) => (
              <Space>
                <Button 
                  icon={<EditOutlined />} 
                  size="small"
                  onClick={() => useRouter().push(`/admin/${record.id}`)}
                />
                <Button 
                  icon={<DeleteOutlined />} 
                  danger 
                  size="small"
                  onClick={() => console.log('Delete:', record.id)}
                />
              </Space>
            )
          }
        ]}
        dataSource={data?.items || []}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.totalCount || 0,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (total: number) => `총 ${total}개 항목`
        }}
        loading={isLoading}
        style={{ background: 'white' }}
      />
    </div>
  );
}