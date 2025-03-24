import React from 'react';
import { Typography, List, Card } from 'antd';
import { useEffect, useState } from 'react';
import { getCachedNews } from '@/utils/cacheUtils';

const { Title, Text } = Typography;

export default function OfflinePage() {
  const [cachedNews, setCachedNews] = useState([]);

  useEffect(() => {
    const loadCachedNews = async () => {
      const news = await getCachedNews();
      setCachedNews(news);
    };
    loadCachedNews();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>오프라인 모드</Title>
      <Text>인터넷 연결이 없습니다. 최근 본 뉴스를 확인해보세요.</Text>
      
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={cachedNews}
        renderItem={(item: any) => (
          <List.Item>
            <Card title={item.title}>
              <p>{item.description}</p>
              <Text type="secondary">{new Date(item.pub_date).toLocaleDateString()}</Text>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}