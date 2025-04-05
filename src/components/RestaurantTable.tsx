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

  return (
    <Table 
      loading={loading}
      columns={[
        {
          title: '카테고리',
          dataIndex: 'category',
          key: 'category',
          width: 100,
        },
        {
          title: '식당명',
          dataIndex: 'name',
          key: 'name',
          render: (text: any, record: RestaurantItem) => (
            record.link ? (
              <a 
                href={record.link} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => handleClick(record)}
                style={{ fontWeight: 500 }}
              >
                {text}
              </a>
            ) : (
              <span onClick={() => handleClick(record)}>{text}</span>
            )
          ),
        },
        {
          title: '위치',
          dataIndex: 'location',
          key: 'location',
        },
        {
          title: '연락처',
          dataIndex: 'pnum',
          key: 'pnum',
          width: 150,
        },
        {
          title: '가격대',
          dataIndex: 'price',
          key: 'price',
          width: 120,
        },
        {
          title: '비고',
          dataIndex: 'remark',
          key: 'remark',
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
  );
} 