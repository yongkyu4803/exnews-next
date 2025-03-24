import React from 'react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { getRecentNews } from '@/utils/indexedDBUtils';
import styled from '@emotion/styled';
import { OfflineNewsItem } from '@/types';

const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false }) as any;
const List = dynamic(() => import('antd/lib/list'), { ssr: false }) as any;
const Card = dynamic(() => import('antd/lib/card'), { ssr: false }) as any;
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;
const Empty = dynamic(() => import('antd/lib/empty'), { ssr: false }) as any;
const Skeleton = dynamic(() => import('antd/lib/skeleton'), { ssr: false }) as any;

const { Title, Text, Paragraph } = Typography;

const OfflineContainer = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const StatusBox = styled.div`
  padding: 16px;
  border-radius: 8px;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  margin-bottom: 24px;
`;

const NetworkStatus = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  &:before {
    content: '';
    display: block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #ff4d4f;
    margin-right: 8px;
  }
`;

const EmptyContainer = styled.div`
  margin-top: 40px;
  text-align: center;
`;

interface NewsItem {
  id: string | number;
  title: string;
  description?: string;
  pub_date: string;
  original_link: string;
  category: string;
  viewedAt?: string;
}

function OfflinePage() {
  const [cachedNews, setCachedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // 클라이언트 사이드에서만 navigator.onLine 확인
    setNetworkStatus(navigator.onLine);
  }, []);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (!isMounted) return;
    
    const loadCachedNews = async () => {
      setLoading(true);
      try {
        // IndexedDB에서 최근 본 뉴스 가져오기
        const news = await getRecentNews(30);
        setCachedNews(news);
      } catch (error) {
        console.error('오프라인 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCachedNews();

    // 네트워크 상태 이벤트 리스너 추가
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isMounted]);

  // 네트워크 연결 시 홈으로 이동
  const goToHome = () => {
    window.location.href = '/';
  };

  // 서버 사이드 렌더링 시 로딩 UI 표시
  if (!isMounted) {
    return (
      <OfflineContainer>
        <Skeleton active paragraph={{ rows: 10 }} />
      </OfflineContainer>
    );
  }

  return (
    <OfflineContainer>
      <StatusBox>
        <NetworkStatus>
          <Text strong>{networkStatus ? '온라인' : '오프라인'}</Text>
        </NetworkStatus>
        <Paragraph>
          {networkStatus 
            ? '네트워크 연결이 복구되었습니다. 홈 페이지로 이동할 수 있습니다.' 
            : '인터넷 연결이 없습니다. 이전에 저장된 뉴스만 확인할 수 있습니다.'}
        </Paragraph>
        {networkStatus && (
          <Button type="primary" onClick={goToHome}>
            홈 페이지로 이동
          </Button>
        )}
      </StatusBox>

      <Title level={2}>저장된 뉴스</Title>
      <Paragraph>
        이전에 본 뉴스 중 오프라인에서도 접근할 수 있는 항목입니다.
      </Paragraph>
      
      {loading ? (
        <div>
          {[1, 2, 3].map((num) => (
            <Card key={num} style={{ marginBottom: 16 }}>
              <Skeleton active />
            </Card>
          ))}
        </div>
      ) : cachedNews.length > 0 ? (
        <List
          dataSource={cachedNews}
          renderItem={(item: NewsItem) => (
            <List.Item>
              <Card
                title={item.title}
                style={{ width: '100%', marginBottom: 16 }}
                hoverable
              >
                <p>{item.description || '설명 없음'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">카테고리: {item.category}</Text>
                  <Text type="secondary">
                    {new Date(item.pub_date).toLocaleDateString('ko-KR')}
                  </Text>
                </div>
                {item.viewedAt && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" italic>
                      최근 조회: {new Date(item.viewedAt).toLocaleString('ko-KR')}
                    </Text>
                  </div>
                )}
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <EmptyContainer>
          <Empty
            description="저장된 뉴스가 없습니다"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Paragraph style={{ marginTop: 16 }}>
            온라인 상태에서 뉴스를 읽으면 자동으로 저장됩니다.
          </Paragraph>
        </EmptyContainer>
      )}
    </OfflineContainer>
  );
}

// 이 페이지는 클라이언트 사이드에서만 렌더링
export default dynamic(() => Promise.resolve(OfflinePage), {
  ssr: false
});