import React from 'react';
import dynamic from 'next/dynamic';
import { RestaurantItem } from '@/types';

// antd/lib/table에서 직접 가져오기
const Table = dynamic(() => import('antd/lib/table'), { ssr: false }) as any;
const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false }) as any;

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
  const handleClick = (record: RestaurantItem) => {
    // 클릭 이벤트 트래킹 (필요한 경우)
    console.log('식당 정보 클릭:', record.name);
  };

  // 카테고리별 배경색 매핑
  const getCategoryColor = (category: string) => {
    const colorMap: {[key: string]: string} = {
      '한식': '#f5f5f5',
      '중식': '#fff1f0',
      '일식/해산물': '#e6f7ff',
      '이탈리안': '#f6ffed',
      '카페': '#fff7e6',
      '기타': '#f9f0ff'
    };
    return colorMap[category] || '#f0f2f5';
  };

  return (
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
            </div>
          ),
        },
        {
          title: '정보',
          dataIndex: 'location',
          key: 'location',
          render: (_: any, record: RestaurantItem) => (
            <div style={{ lineHeight: '1.4', fontSize: '0.94em' }}>
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
      onRow={(record: RestaurantItem) => ({
        style: { backgroundColor: getCategoryColor(record.category) }
      })}
    />
  );
} 