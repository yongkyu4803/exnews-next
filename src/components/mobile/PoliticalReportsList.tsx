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

// 게시판 목록 컨테이너
const ReportList = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  overflow: hidden;
`;

// 게시판 목록 아이템
const ReportListItem = styled.div`
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f9fafb;
  }

  @media (max-width: 768px) {
    padding: 14px 16px;
  }
`;

const ListItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const ListItemTitle = styled.h3`
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
  margin: 0;
  line-height: 1.5;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ListItemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 12px;
    gap: 8px;
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

// 최신 뉴스 전용 컨테이너 (그리드 밖에 배치)
const LatestReportContainer = styled.div`
  margin-bottom: 24px;

  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

// 최신 리포트 카드 (더 크고 상세한 버전)
const LatestReportCard = styled.div`
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #3b82f6;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
  }

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

// 요약 섹션
const SummarySection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(59, 130, 246, 0.2);
`;

const SummaryLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SummaryText = styled.p`
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

// 키워드 섹션
const KeywordsSection = styled.div`
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const KeywordTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  font-size: 12px;
  color: #1e40af;
  font-weight: 500;

  &::before {
    content: '#';
    margin-right: 2px;
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 3px 10px;
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

      {/* 최신 리포트 (그리드 밖에 별도 배치) */}
      {reports.length > 0 && (
        <LatestReportContainer>
          <LatestReportCard onClick={() => handleCardClick(reports[0].slug)}>
            <CardHeader>
              <CardTitle>
                <NewBadge>NEW</NewBadge>
                {reports[0].topic}
              </CardTitle>
              <CardMeta>
                <MetaItem>
                  <span>📅</span>
                  {formatDate(reports[0].created_at)}
                </MetaItem>
                {reports[0].duration_ms && (
                  <MetaItem>
                    <span>⏱️</span>
                    {formatDuration(reports[0].duration_ms)}
                  </MetaItem>
                )}
                {reports[0].cost_usd && (
                  <MetaItem>
                    <span>💰</span>
                    ${reports[0].cost_usd}
                  </MetaItem>
                )}
              </CardMeta>
            </CardHeader>

            {/* 요약 섹션 */}
            {reports[0].summary && (
              <SummarySection>
                <SummaryText>{reports[0].summary}</SummaryText>
              </SummarySection>
            )}

            {/* 핵심 키워드 섹션 */}
            {reports[0].keywords && reports[0].keywords.length > 0 && (
              <KeywordsSection>
                {reports[0].keywords.slice(0, 5).map((keyword, idx) => (
                  <KeywordTag key={idx}>{keyword}</KeywordTag>
                ))}
              </KeywordsSection>
            )}
          </LatestReportCard>
        </LatestReportContainer>
      )}

      {/* 나머지 리포트들 (게시판 목록) */}
      {reports.length > 1 && (
        <ReportList>
          {reports.slice(1).map((report) => (
            <ReportListItem
              key={report.id}
              onClick={() => handleCardClick(report.slug)}
            >
              <ListItemHeader>
                <ListItemTitle>{report.topic}</ListItemTitle>
                <ListItemMeta>
                  <MetaItem>
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
                </ListItemMeta>
              </ListItemHeader>
            </ReportListItem>
          ))}
        </ReportList>
      )}
    </Container>
  );
};

export default React.memo(PoliticalReportsList);
