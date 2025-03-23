import React from 'react';
import { Card, Typography, Space } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { NewsItem } from '@/types';
import ClipboardButton from '@/components/ClipboardButton';

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