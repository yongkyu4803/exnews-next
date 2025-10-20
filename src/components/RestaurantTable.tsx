import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { RestaurantItem } from '@/types';

// antd/lib/table에서 직접 가져오기
const Table = dynamic(() => import('antd/lib/table'), { ssr: false }) as any;
const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false }) as any;
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;
const Space = dynamic(() => import('antd/lib/space'), { ssr: false }) as any;

// 빌딩 뷰 컴포넌트 동적 로딩 (현재 사용하지 않음)
// const RestaurantBuildingView = dynamic(() => import('./RestaurantBuildingView'), { 
//   ssr: false,
//   loading: () => <div>빌딩 뷰 로딩 중...</div>
// });

interface RestaurantTableProps {
  items: RestaurantItem[];
  selectedKeys?: React.Key[];
  onSelectChange?: (keys: React.Key[], rows: RestaurantItem[]) => void;
  loading?: boolean;
}

export default function RestaurantTable({ 
  items, 
  selectedKeys, 
  onSelectChange, 
  loading = false 
}: RestaurantTableProps) {
  const [viewMode, setViewMode] = useState<'table' | 'building'>('table');

  const handleClick = (record: RestaurantItem) => {
    // 클릭 이벤트 트래킹 (필요한 경우)
    console.log('식당 정보 클릭:', record.name);
  };

  // 카테고리별 텍스트 색상 매핑 (배경색은 제거)
  const getCategoryTextColor = (category: string) => {
    const colorMap: {[key: string]: string} = {
      '전체': '#000000',
      '중식': '#cf1322',
      '일식/해산물': '#1677ff',
      '이탈리안': '#389e0d',
      '카페': '#722ed1',
      '기타': '#5c6b77'
    };
    return colorMap[category] || '#333';
  };

  return (
    <div>
      {/* 뷰 전환 버튼 */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button 
            type={viewMode === 'table' ? 'primary' : 'default'}
            onClick={() => setViewMode('table')}
            icon="📋"
          >
            테이블 뷰
          </Button>
          <Button 
            type={viewMode === 'building' ? 'primary' : 'default'}
            onClick={() => setViewMode('building')}
            icon="🏢"
          >
            빌딩별 뷰
          </Button>
        </Space>
        {selectedKeys && selectedKeys.length > 0 && (
          <Typography.Text type="secondary">
            선택됨: {selectedKeys.length}개
          </Typography.Text>
        )}
      </div>

      {/* 조건부 렌더링 */}
      {viewMode === 'table' ? (
        <Table 
          loading={loading}
          columns={[
            {
              title: '식당명',
              dataIndex: 'name',
              key: 'name',
              width: 180,
              render: (text: any, record: RestaurantItem) => (
                <div style={{ fontWeight: 500 }}>
                  {record.link ? (
                    <a 
                      href={record.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => handleClick(record)}
                    >
                      {text}
                    </a>
                  ) : (
                    <span onClick={() => handleClick(record)}>{text}</span>
                  )}
                  <span style={{ 
                    marginLeft: '8px', 
                    fontSize: '0.8rem', 
                    color: getCategoryTextColor(record.category),
                    fontWeight: 'normal'
                  }}>
                    {record.category}
                  </span>
                </div>
              ),
            },
            {
              title: '정보',
              dataIndex: 'location',
              key: 'location',
              render: (_: any, record: RestaurantItem) => (
                <div style={{ lineHeight: '1.4', fontSize: '0.94em' }}>
                  {record.building_name && (
                    <div style={{ 
                      marginBottom: '4px', 
                      fontWeight: 'bold', 
                      color: '#1677ff',
                      fontSize: '0.9em'
                    }}>
                      🏢 {record.building_name}
                    </div>
                  )}
                  <div>📍 {record.location}</div>
                  {record.pnum && <div style={{ marginTop: '3px' }}>📞 {record.pnum}</div>}
                  {record.price && <div style={{ marginTop: '3px' }}>💰 {record.price}</div>}
                  {record.remark && <div style={{ marginTop: '3px', color: '#666' }}>💬 {record.remark}</div>}
                </div>
              )
            },
          ] as any}
          dataSource={items}
          rowKey={(record: RestaurantItem) => record.id?.toString() || record.name}
          rowSelection={onSelectChange ? {
            selectedRowKeys: selectedKeys,
            onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
              onSelectChange(selectedRowKeys, selectedRows as RestaurantItem[]);
            },
          } : undefined}
          pagination={{
            position: ['bottomCenter'],
            showSizeChanger: true,
            showTotal: (total: number, range: [number, number]) => `총 ${total}개 중 ${range[0]}-${range[1]}`,
            defaultPageSize: 15,
            pageSizeOptions: ['10', '15', '30', '50'],
          }}
          scroll={{ x: 'max-content' }}
          style={{ marginTop: 16 }}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          빌딩별 보기는 현재 식당 페이지에서 이용 가능합니다.
        </div>
      )}
    </div>
  );
} 