import React from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { TableProps } from 'antd/lib/table';
import { cacheNews } from '@/utils/cacheUtils';

interface NewsItem {
  title: string;
  original_link: string;
  pub_date: string;
  category: string;
  description?: string;
  processed_at?: string;
}

// antd/lib/table에서 직접 가져오기
const Table = dynamic(() => import('antd/lib/table'), { ssr: false }) as ComponentType<TableProps<NewsItem>>;

interface NewsTableProps {
  items: NewsItem[];
  selectedKeys: React.Key[];
  onSelectChange: (keys: React.Key[], rows: NewsItem[]) => void;
}

export default function NewsTable({ items, selectedKeys, onSelectChange }: NewsTableProps) {
  // 뉴스 캐싱 함수
  const handleCacheNews = async (item: NewsItem) => {
    await cacheNews(item);
  };

  return (
    <div style={{ 
      width: '100%', 
      overflowX: 'hidden', 
      overflowY: 'hidden' 
    }}>
      <Table 
        size="small"
        columns={[
          {
            title: '제목',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: NewsItem) => (
              <a href={record.original_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontWeight: 600 }}
                onClick={() => handleCacheNews(record)}
              >
                {text}
              </a>
            )
          },
          {
            title: '카테고리',
            dataIndex: 'category',
            key: 'category',
            width: 100,
          },
          {
            title: '발행일',
            dataIndex: 'pub_date',
            key: 'pub_date',
            width: 180,
            render: (date: string) => {
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
        dataSource={items}
        rowKey={(record: NewsItem) => record.original_link}
        rowSelection={{
          onChange: (selectedRowKeys: React.Key[], selectedRows: NewsItem[]) => {
            onSelectChange(selectedRowKeys, selectedRows);
          },
          selectedRowKeys: selectedKeys,
        }}
        pagination={{ position: ['bottomCenter'] }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
} 