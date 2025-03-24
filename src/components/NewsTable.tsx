import React from 'react';
import dynamic from 'next/dynamic';
import { cacheNews } from '@/utils/cacheUtils';

const Table = dynamic(() => import('antd').then((antd) => antd.Table), { ssr: false });

interface NewsItem {
  title: string;
  original_link: string;
  pub_date: string;
  category: string;
  [key: string]: any;
}

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
      dataSource={items}
      rowKey={(record: any) => record.original_link}
      rowSelection={{
        onChange: (selectedRowKeys, selectedRows: any[]) => {
          onSelectChange(selectedRowKeys, selectedRows as NewsItem[]);
        },
        selectedRowKeys: selectedKeys,
      }}
    />
  );
} 