import React from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { TableProps } from 'antd/lib/table';
import { RankingNewsItem } from '@/types';
import { trackEvent } from '@/utils/analyticsUtils';

// antd/lib/table에서 직접 가져오기
const Table = dynamic(() => import('antd/lib/table'), { ssr: false }) as ComponentType<TableProps<RankingNewsItem>>;

interface RankingNewsTableProps {
  items: RankingNewsItem[];
  selectedKeys: React.Key[];
  onSelectChange: (keys: React.Key[], rows: RankingNewsItem[]) => void;
}

export default function RankingNewsTable({ items, selectedKeys, onSelectChange }: RankingNewsTableProps) {
  const handleClick = (record: RankingNewsItem) => {
    // 랭킹 뉴스 클릭 이벤트 트래킹
    trackEvent('click_ranking_news', { id: record.id || '', title: record.title || '' });
  };

  return (
    <Table 
      size="small"
      columns={[
        {
          title: '제목',
          dataIndex: 'title',
          key: 'title',
          render: (text: string, record: RankingNewsItem) => (
            <a href={record.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 600 }}
              onClick={() => handleClick(record)}
            >
              {text}
            </a>
          )
        },
        {
          title: '매체',
          dataIndex: 'media_name',
          key: 'media_name',
          width: 120,
        }
      ]}
      dataSource={items}
      rowKey={(record: RankingNewsItem) => record.id || record.title}
      rowSelection={{
        onChange: (selectedRowKeys: React.Key[], selectedRows: RankingNewsItem[]) => {
          onSelectChange(selectedRowKeys, selectedRows);
        },
        selectedRowKeys: selectedKeys,
      }}
      pagination={{
        pageSize: 15,
        showSizeChanger: true,
        pageSizeOptions: ['10', '15', '30', '50'],
        showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} / ${total}개 항목`
      }}
    />
  );
} 