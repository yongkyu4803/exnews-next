import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Typography, Space, Alert, Tabs, Button, message } from 'antd';
import dynamic from 'next/dynamic';
import { fetchNewsItems, fetchCategories } from '@/lib/api';
import { CopyOutlined } from '@ant-design/icons';

const { Title } = Typography;

// Table 컴포넌트를 클라이언트 사이드에서만 로드
const Table = dynamic(() => import('antd').then((antd) => antd.Table), { 
  ssr: false 
});

interface NewsItemsResponse {
  items: any[];
  totalCount: number;
}

export default function HomePage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Categories query
  const { data: categories = [] } = useQuery<string[], Error>(
    'categories',
    fetchCategories
  );

  // News items query
  const { data, isLoading, error } = useQuery<NewsItemsResponse, Error>(
    ['newsItems', page, pageSize, selectedCategory],
    async () => {
      const result = await fetchNewsItems({ page, pageSize, category: selectedCategory });
      console.log('API Response:', result.items); // 데이터 확인용 로그
      return result;
    },
    { keepPreviousData: true }
  );

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === 'all' ? undefined : category);
    setPage(1);
  };

  const handleCopyToClipboard = () => {
    if (selectedRows.length === 0) {
      message.warning('선택된 기사가 없습니다.');
      return;
    }

    const textToCopy = selectedRows
      .map(item => `${item.title}\n${item.original_link}\n${new Date(item.pub_date).toLocaleString('ko-KR')}\n`)
      .join('\n');

    navigator.clipboard.writeText(textToCopy)
      .then(() => message.success('클립보드에 복사되었습니다.'))
      .catch(() => message.error('클립보드 복사에 실패했습니다.'));
  };

  // 선택된 키들을 관리하기 위한 state 추가
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  return (
    <div style={{ padding: '20px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>🚨 단독 뉴스</Title>
          <Button 
            icon={<CopyOutlined />} 
            onClick={handleCopyToClipboard}
            disabled={selectedRows.length === 0}
          >
            선택 기사 복사 ({selectedRows.length})
          </Button>
        </div>
      
      <Tabs
        defaultActiveKey="all"
        onChange={handleCategoryChange}
        items={[
          { key: 'all', label: '전체', className: 'tab-all' },
          { key: '정치', label: '정치', className: 'tab-politics' },
          { key: '경제', label: '경제', className: 'tab-economy' },
          { key: '사회', label: '사회', className: 'tab-social' },
          { key: '국제', label: '국제', className: 'tab-international' },
          { key: '문화', label: '문화', className: 'tab-culture' },
          { key: '연예/스포츠', label: '연예/스포츠', className: 'tab-entertainment' },
          { key: '기타', label: '기타', className: 'tab-etc' }
        ]}
        style={{ 
          marginBottom: '12px',
          backgroundColor: '#ffffff',
          padding: '8px',
          borderRadius: '4px'
        }}
        className="category-tabs"
      />
      
      {error && (
        <Alert
          message="데이터 로딩 오류"
          description={error.message}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
      
      <Table 
        size="small"
        columns={[
          { 
            title: '제목',
            dataIndex: 'title',
            render: (text, record: any) => (
              <a href={record.original_link} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ fontWeight: 600 }}  // 글자 두께 추가
              >
                {text}
              </a>
            )
          },
          { 
            title: '카테고리',
            dataIndex: 'category',
            width: 100,
          },
          { 
            title: '발행일',
            dataIndex: 'pub_date',
            width: 180,
            render: (date) => {
              const d = new Date(date);
              return d.getFullYear() + '-' + 
                     String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(d.getDate()).padStart(2, '0') + ' ' + 
                     String(d.getHours()).padStart(2, '0') + ':' + 
                     String(d.getMinutes()).padStart(2, '0') + ':' + 
                     String(d.getSeconds()).padStart(2, '0');
            }
          }
        ]}
        dataSource={data?.items || []}
        rowKey={(record: any) => record.original_link}
        rowSelection={{
          onChange: (selectedRowKeys, selectedRows) => {
            setSelectedKeys(selectedRowKeys);
            setSelectedRows(selectedRows);
          },
          selectedRowKeys: selectedKeys,
        }}
      />
      </Space>
    </div>
  );
}