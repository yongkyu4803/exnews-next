import React from 'react';
import dynamic from 'next/dynamic';
import { CalendarOutlined } from '@ant-design/icons';
import { NewsItem } from '@/types';
import ClipboardButton from '@/components/ClipboardButton';

// 동적 임포트
const Card = dynamic(() => import('antd/lib/card'), { ssr: false }) as any;
const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false }) as any;
const Space = dynamic(() => import('antd/lib/space'), { ssr: false }) as any;

const { Title, Text } = Typography;

interface DataCardProps {
  item: NewsItem;
}

const DataCard: React.FC<DataCardProps> = ({ item }) => {
  const formattedDate = new Date(item.pub_date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card 
      className="data-card"
      actions={[
        <ClipboardButton key="copy" item={item} />
      ]}
    >
      <Space direction="vertical" size="small">
        <Title level={4}>
          <a href={item.original_link} target="_blank" rel="noopener noreferrer">
            {item.title}
          </a>
        </Title>
        <Space>
          <CalendarOutlined />
          <Text type="secondary">{formattedDate}</Text>
        </Space>
        <Text type="secondary">카테고리: {item.category}</Text>
      </Space>
    </Card>
  );
};

export default DataCard;