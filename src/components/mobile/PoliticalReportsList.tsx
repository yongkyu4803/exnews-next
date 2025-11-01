/**
 * 정치 뉴스 리포트 목록 컴포넌트
 *
 * Supabase에서 정치 리포트 목록을 가져와 표시합니다.
 */

import React from 'react';
import styled from '@emotion/styled';
import { useQuery } from 'react-query';
import type { ReportListItem } from '@/types/political-report';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Component:PoliticalReportsList');

const Container = styled.div`
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const Header = styled.div`
  display: none;
`;

const ReportGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const ReportCard = styled.div<{ isLatest?: boolean }>`
  position: relative;
  background: ${props => props.isLatest
    ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
    : 'white'};
  border: ${props => props.isLatest ? '2px solid #3b82f6' : '1px solid #e5e7eb'};
  border-radius: 12px;
  padding: 6px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.isLatest
    ? '0 4px 12px rgba(59, 130, 246, 0.15)'
    : '0 1px 3px rgba(0, 0, 0, 0.05)'};

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.isLatest
      ? '0 8px 20px rgba(59, 130, 246, 0.25)'
      : '0 8px 16px rgba(0, 0, 0, 0.1)'};
    border-color: #3b82f6;
  }

  @media (max-width: 768px) {
    padding: 5px 16px;
  }
`;

const CardHeader = styled.div`
  margin-bottom: 12px;
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
  line-height: 1.4;
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const NewBadge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  letter-spacing: 0.5px;
  margin-right: 8px;
  vertical-align: middle;

  @media (max-width: 768px) {
    font-size: 10px;
    padding: 2px 6px;
    margin-right: 6px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  font-size: 16px;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 20px;
  text-align: center;

  h3 {
    font-size: 20px;
    color: #ef4444;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #666;
  }
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 20px;
  text-align: center;

  h3 {
    font-size: 20px;
    color: #666;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #999;
  }
`;

interface PoliticalReportsListProps {
  onReportClick?: (slug: string) => void;
}

const PoliticalReportsList: React.FC<PoliticalReportsListProps> = ({ onReportClick }) => {
  const { data, isLoading, error } = useQuery<{ success: boolean; reports: ReportListItem[] }>(
    'politicalReports',
    async () => {
      logger.info('정치 리포트 목록 요청 시작');
      const response = await fetch('/api/political-reports');
      if (!response.ok) {
        throw new Error('Failed to fetch political reports');
      }
      const result = await response.json();
      logger.info('정치 리포트 목록 요청 완료', { count: result.reports?.length || 0 });
      return result;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000 // 5분
    }
  );

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return '';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    }
    return `${seconds}초`;
  };

  const handleCardClick = (slug: string) => {
    logger.info('리포트 카드 클릭', { slug });
    if (onReportClick) {
      onReportClick(slug);
    } else {
      // 기본 동작: 새 탭에서 열기
      window.open(`/political-report/${slug}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>정치 리포트를 불러오는 중...</LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          <h3>⚠️ 오류 발생</h3>
          <p>정치 리포트를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
        </ErrorContainer>
      </Container>
    );
  }

  const reports = data?.reports || [];

  if (reports.length === 0) {
    return (
      <Container>
        <Header>
          <h1>📰 정치 뉴스 리포트</h1>
          <p>최신 정치 이슈를 분석한 리포트를 확인하세요</p>
        </Header>
        <EmptyContainer>
          <h3>📭 리포트가 없습니다</h3>
          <p>아직 발행된 정치 리포트가 없습니다.</p>
        </EmptyContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1>📰 정치 뉴스 리포트</h1>
        <p>최신 정치 이슈를 분석한 {reports.length}개의 리포트</p>
      </Header>

      <ReportGrid>
        {reports.map((report, index) => (
          <ReportCard
            key={report.id}
            onClick={() => handleCardClick(report.slug)}
            isLatest={index === 0}
          >
            <CardHeader>
              <CardTitle>
                {index === 0 && <NewBadge>NEW</NewBadge>}
                {report.topic}
              </CardTitle>
              <CardMeta>
                <MetaItem>
                  <span>📅</span>
                  {formatDate(report.created_at)}
                </MetaItem>
                {report.duration_ms && (
                  <MetaItem>
                    <span>⏱️</span>
                    {formatDuration(report.duration_ms)}
                  </MetaItem>
                )}
                {report.cost_usd && (
                  <MetaItem>
                    <span>💰</span>
                    ${report.cost_usd}
                  </MetaItem>
                )}
              </CardMeta>
            </CardHeader>
          </ReportCard>
        ))}
      </ReportGrid>
    </Container>
  );
};

export default React.memo(PoliticalReportsList);
