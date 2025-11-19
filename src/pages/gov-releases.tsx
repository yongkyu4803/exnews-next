import React from 'react';
import { useQuery } from 'react-query';
import styled from '@emotion/styled';
import { Spin, Alert, Card, Typography, List } from 'antd';
import { createLogger } from '@/utils/logger';

const logger = createLogger('GovReleases');

const { Title, Text, Link } = Typography;

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const AgencySection = styled.div`
  margin-bottom: 32px;

  @media (max-width: 768px) {
    margin-bottom: 24px;
  }
`;

const AgencyTitle = styled(Title)`
  && {
    margin-bottom: 16px;
    color: #1890ff;
  }
`;

const ReleaseItem = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const ReleaseTitle = styled(Link)`
  font-size: 16px;
  font-weight: 500;
  display: block;
  margin-bottom: 4px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ReleaseInfo = styled.div`
  font-size: 14px;
  color: #666;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

interface PressRelease {
  id: number | string;
  title: string;
  link: string;
  release_date: string;
  department?: string;
  summary?: string;
  agency_code: string;
  created_at: string;
}

interface AgencyData {
  agency_code: string;
  agency_name: string;
  agency_name_en?: string;
  agency_url?: string;
  items: PressRelease[];
  error?: string;
}

const GovReleasesPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<{ data: AgencyData[] }>(
    'govReleases',
    async () => {
      const response = await fetch('/api/gov-releases');
      if (!response.ok) {
        throw new Error('Failed to fetch government press releases');
      }
      return response.json();
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        logger.info('Government press releases loaded', {
          agencies: data.data.length,
          total: data.data.reduce((sum, agency) => sum + agency.items.length, 0),
        });
      },
      onError: (err) => {
        logger.error('Failed to load government press releases', err);
      },
    }
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR');
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>정부기관 보도자료를 불러오는 중...</div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Alert
          message="오류 발생"
          description="정부기관 보도자료를 불러오는데 실패했습니다."
          type="error"
          showIcon
        />
      </PageContainer>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <PageContainer>
        <Alert
          message="데이터 없음"
          description="표시할 보도자료가 없습니다."
          type="info"
          showIcon
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Title level={2}>정부기관 보도자료</Title>

      {data.data.map((agency) => (
        <AgencySection key={agency.agency_code}>
          <Card>
            <AgencyTitle level={3}>
              {agency.agency_name}
              {agency.agency_name_en && (
                <Text type="secondary" style={{ fontSize: '14px', marginLeft: '8px' }}>
                  ({agency.agency_name_en})
                </Text>
              )}
            </AgencyTitle>

            {agency.error ? (
              <Alert
                message={`${agency.agency_name} 데이터 오류`}
                description={agency.error}
                type="warning"
                showIcon
              />
            ) : agency.items.length === 0 ? (
              <Text type="secondary">최근 보도자료가 없습니다.</Text>
            ) : (
              <List
                dataSource={agency.items}
                renderItem={(item) => (
                  <ReleaseItem key={item.id}>
                    <ReleaseTitle href={item.link} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </ReleaseTitle>
                    <ReleaseInfo>
                      {item.release_date && <span>{formatDate(item.release_date)}</span>}
                      {item.department && (
                        <>
                          <span style={{ margin: '0 8px' }}>|</span>
                          <span>{item.department}</span>
                        </>
                      )}
                    </ReleaseInfo>
                    {item.summary && (
                      <div style={{ marginTop: '8px', fontSize: '13px', color: '#888' }}>
                        {item.summary.substring(0, 150)}
                        {item.summary.length > 150 && '...'}
                      </div>
                    )}
                  </ReleaseItem>
                )}
              />
            )}
          </Card>
        </AgencySection>
      ))}
    </PageContainer>
  );
};

export default GovReleasesPage;
