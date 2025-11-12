/**
 * 정치 뉴스 리포트 목록 컴포넌트
 *
 * Supabase에서 정치 리포트 목록을 가져와 표시합니다.
 */

import React, { useState } from 'react';
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

// 이전 리포트 섹션
const PreviousReportsSection = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
`;

const PreviousReportLink = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    transform: translateX(4px);
  }
`;

const PreviousReportDate = styled.span`
  font-size: 14px;
  color: #4b5563;
  font-weight: 500;
`;

const ViewDetailText = styled.span`
  font-size: 13px;
  color: #3b82f6;
  font-weight: 500;
`;

// 더 보기 버튼
const ViewMoreButton = styled.button`
  width: 100%;
  padding: 14px;
  margin-top: 24px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #3b82f6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f9fafb;
    border-color: #3b82f6;
  }
`;

// 페이지네이션 UI
const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 32px;
  padding: 20px 0;
`;

const PageButton = styled.button<{ active?: boolean }>`
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid ${props => props.active ? '#3b82f6' : '#e5e7eb'};
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#374151'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: #3b82f6;
    ${props => !props.active && 'background: #f9fafb;'}
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface PoliticalReportsListProps {
  onReportClick?: (slug: string) => void;
}

const PoliticalReportsList: React.FC<PoliticalReportsListProps> = ({ onReportClick }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [useLandingMode, setUseLandingMode] = useState<boolean>(true);

  const { data, isLoading, error } = useQuery<{
    success: boolean;
    latest?: ReportListItem | null;
    previous?: Array<{ id: string; created_at: string; slug: string; topic: string }>;
    reports?: ReportListItem[];
    totalCount: number;
  }>(
    useLandingMode ? 'politicalReportsLandingV2' : ['politicalReportsPaginationV2', currentPage],
    async () => {
      if (useLandingMode) {
        logger.info('정치 리포트 랜딩 모드 요청 시작');
        const response = await fetch('/api/political-reports?landing=true&_t=' + Date.now());
        if (!response.ok) {
          throw new Error('Failed to fetch political reports');
        }
        const result = await response.json();
        console.log('Political Reports Landing API Response:', result);
        return result;
      } else {
        logger.info('정치 리포트 페이지네이션 모드 요청 시작', { page: currentPage });
        const response = await fetch(`/api/political-reports?page=${currentPage}&pageSize=12&_t=` + Date.now());
        if (!response.ok) {
          throw new Error('Failed to fetch political reports');
        }
        const result = await response.json();
        console.log('Political Reports Pagination API Response:', result);
        return result;
      }
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

  // 데이터 처리
  const latestReport = data?.latest;
  const previousReports = data?.previous || [];
  const paginationReports = data?.reports || [];
  const totalCount = data?.totalCount || 0;

  // 표시할 리포트 결정
  const reports = useLandingMode
    ? (latestReport ? [latestReport] : [])
    : paginationReports;

  if (reports.length === 0 && !useLandingMode) {
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
        <p>최신 정치 이슈를 분석한 리포트를 확인하세요</p>
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

      {/* 나머지 리포트들 (게시판 목록) - 페이지네이션 모드에서만 표시 */}
      {!useLandingMode && reports.length > 1 && (
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

      {/* 랜딩 모드: 이전 리포트 섹션 + 더 보기 버튼 */}
      {useLandingMode && previousReports.length > 0 && (
        <>
          <PreviousReportsSection>
            <SectionTitle>이전 리포트</SectionTitle>
            {previousReports.map((report) => (
              <PreviousReportLink
                key={report.id}
                onClick={() => handleCardClick(report.slug)}
              >
                <PreviousReportDate>
                  {formatDate(report.created_at)}
                </PreviousReportDate>
                <ViewDetailText>자세히 보기 →</ViewDetailText>
              </PreviousReportLink>
            ))}
          </PreviousReportsSection>

          {/* 더 보기 버튼 */}
          {(() => {
            console.log('Political ViewMore Button Check:', { totalCount, shouldShow: totalCount > 5 });
            return totalCount > 5 && (
              <ViewMoreButton onClick={() => {
                console.log('Switching to pagination mode');
                setUseLandingMode(false);
              }}>
                전체 리포트 보기 ({totalCount}개) →
              </ViewMoreButton>
            );
          })()}
        </>
      )}

      {/* 페이지네이션 모드: 페이지네이션 UI */}
      {!useLandingMode && totalCount > 12 && (
        <PaginationContainer>
          <PageButton
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ←
          </PageButton>

          {Array.from({ length: Math.min(5, Math.ceil(totalCount / 12)) }, (_, i) => {
            const startPage = Math.max(1, currentPage - 2);
            const pageNum = startPage + i;
            const totalPages = Math.ceil(totalCount / 12);

            if (pageNum > totalPages) return null;

            return (
              <PageButton
                key={pageNum}
                active={pageNum === currentPage}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </PageButton>
            );
          })}

          <PageButton
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / 12), p + 1))}
            disabled={currentPage >= Math.ceil(totalCount / 12)}
          >
            →
          </PageButton>
        </PaginationContainer>
      )}
    </Container>
  );
};

export default React.memo(PoliticalReportsList);
