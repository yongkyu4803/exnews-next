import React from 'react';
import { Table, Space, Button, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { NewsItem } from '@/types';
import { formatInTimeZone } from 'date-fns-tz';

interface DataTableProps {
  data: NewsItem[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
}) => {
  const router = useRouter();

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: NewsItem) => (
        <a href={record.original_link} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color="blue" key={category}>
          {category}
        </Tag>
      ),
    },
    {
      title: '발행일',
      dataIndex: 'pub_date',
      key: 'pub_date',
      width: 180,
      render: (dateStr: string) => {
        try {
          return formatInTimeZone(new Date(dateStr), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
        } catch (error) {
          return dateStr;
        }
      },
    },
    {
      title: '처리일시',
      dataIndex: 'processed_at',
      key: 'processed_at',
      width: 180,
      render: (dateStr: string) => {
        if (!dateStr) return '-';
        try {
          return formatInTimeZone(new Date(dateStr), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
        } catch (error) {
          return dateStr;
        }
      },
    },
    {
      title: '작업',
      key: 'action',
      width: 120,
      render: (_: any, record: NewsItem) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => router.push(`/admin/${record.id}`)}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => console.log('Delete item:', record.id)}
          />
        </Space>
      ),
    },
  ];

  // 디버깅을 위한 콘솔 로그 추가
  console.log('DataTable 렌더링됨', new Date().toISOString());
  
  // 컴포넌트 시작 부분에 추가
  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      pagination={{
        current: page,
        pageSize: pageSize,
        total: total,
        onChange: onPageChange,
        showSizeChanger: true,
        showTotal: (total) => `총 ${total}개 항목`,
      }}
      loading={loading}
      scroll={{ x: 1000 }}
    />
  );
};

export default DataTable;