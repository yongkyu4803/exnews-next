/**
 * 법안 모니터링 리포트 목록 컴포넌트
 */

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useQuery } from 'react-query';
import type { BillsReport } from '@/types/bills';
import BillsReportDetail from './BillsReportDetail';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const Header = styled.div`
  display: none;
`;

const ReportCard = styled.div<{ selected?: boolean }>`
  background: white;
  border: 1px solid ${props => props.selected ? '#3b82f6' : '#e5e7eb'};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: flex-start;
  gap: 12px;

  ${props => props.selected && `
    background: #eff6ff;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const CardContent = styled.div`
  flex: 1;
  cursor: pointer;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const CardDate = styled.div`
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
  margin-left: 12px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const CardOverview = styled.p`
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  margin: 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const Statistics = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

const StatBadge = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  background-color: ${props => props.color}15;
  color: ${props => props.color};
  border: 1px solid ${props => props.color}40;

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 3px 8px;
  }
`;

const TrendsList = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
`;

const TrendItem = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin: 4px 0;
  padding-left: 12px;
  position: relative;

  &:before {
    content: '•';
    position: absolute;
    left: 0;
    color: #9ca3af;
  }

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #dc2626;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 16px;
`;

const ActionBar = styled.div`
  position: sticky;
  top: 0;
  background: white;
  padding: 16px;
  margin: -20px -20px 20px -20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    margin: -16px -16px 16px -16px;
    padding: 12px 16px;
  }
`;

const SelectInfo = styled.div`
  font-size: 14px;
  color: #6b7280;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: #f9fafb;
    border-color: #3b82f6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 13px;
  }
`;

const PrimaryButton = styled(ActionButton)`
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;

  &:hover {
    background: #2563eb;
    border-color: #2563eb;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin-right: 12px;
  flex-shrink: 0;
`;

const PreviousReportsSection = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 16px 0;
`;

const PreviousReportLink = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    border-color: #3b82f6;
    background: #f9fafb;
  }
`;

const PreviousReportDate = styled.span`
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
`;

const ViewDetailText = styled.span`
  font-size: 13px;
  color: #6b7280;
`;

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

interface BillsReportsListProps {
  onReportClick?: (slug: string) => void;
  selectedSlug?: string | null;
  onBack?: () => void;
}

const BillsReportsList: React.FC<BillsReportsListProps> = ({
  onReportClick,
  selectedSlug: externalSelectedSlug,
  onBack: externalOnBack
}) => {
  const [internalSelectedSlug, setInternalSelectedSlug] = useState<string | null>(null);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [useLandingMode, setUseLandingMode] = useState<boolean>(true);

  // 외부에서 제어하거나 내부 상태 사용
  const selectedSlug = externalSelectedSlug !== undefined ? externalSelectedSlug : internalSelectedSlug;
  const setSelectedSlug = onReportClick || setInternalSelectedSlug;
  const handleBack = externalOnBack || (() => setInternalSelectedSlug(null));

  // 체크박스 토글
  const toggleReportSelection = (reportId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedReports.size === sortedReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(sortedReports.map(r => r.id)));
    }
  };

  // 클립보드 복사
  const handleCopyToClipboard = async () => {
    if (selectedReports.size === 0) {
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((msg) => {
          msg.default.info('선택된 리포트가 없습니다.');
        });
      }
      return;
    }

    const selectedData = sortedReports.filter(r => selectedReports.has(r.id));

    const textToCopy = `[가장빠른 법안분석 정보 - 어제 발의된 법안]\n\n` +
      selectedData.map(report => {
        const regStats = report.statistics?.regulation;
        const classification = `신설 ${regStats?.new || 0}건, 강화 ${regStats?.strengthen || 0}건, 완화 ${regStats?.relax || 0}건`;
        const pageUrl = `${window.location.origin}/?tab=bills&id=${report.slug}`;

        return `${report.headline}\n\n- ${report.overview || '요약 없음'}\n\n- 법안분류: ${classification}\n\n${pageUrl}\n`;
      }).join('\n---\n\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((msg) => {
          msg.default.success(`${selectedReports.size}개 리포트가 복사되었습니다.`);
        });
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((msg) => {
          msg.default.error('복사에 실패했습니다.');
        });
      }
    }
  };

  const { data, isLoading, error } = useQuery<{
    latest?: BillsReport | null;
    previous?: Array<{ id: string; report_date: string; slug: string }>;
    data?: BillsReport[];
    totalCount: number;
  }>(
    useLandingMode ? 'billsReportsLandingV2' : ['billsReportsPaginationV2', currentPage],
    async () => {
      if (useLandingMode) {
        // 랜딩 모드: 최신 1개 전체 + 이전 4개 날짜만
        const res = await fetch('/api/bills?landing=true&_t=' + Date.now());
        const json = await res.json();
        console.log('Bills Landing API Response:', json);
        console.log('✓ latest:', json.latest);
        console.log('✓ latest.bills length:', json.latest?.bills?.length);
        console.log('✓ previous length:', json.previous?.length);
        console.log('✓ totalCount:', json.totalCount);
        return json;
      } else {
        // 페이지네이션 모드
        const res = await fetch(`/api/bills?page=${currentPage}&pageSize=12&_t=` + Date.now());
        const json = await res.json();
        console.log('Bills Pagination API Response:', json);
        return json;
      }
    },
    {
      refetchOnWindowFocus: false,
      staleTime: useLandingMode ? 0 : 5 * 60 * 1000, // 랜딩 모드는 항상 새로 fetch
      cacheTime: useLandingMode ? 0 : 5 * 60 * 1000, // 랜딩 모드는 캐시 안함
    }
  );

  if (isLoading) {
    return (
      <Container>
        <LoadingMessage>법안 리포트를 불러오는 중...</LoadingMessage>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>법안 리포트를 불러오는데 실패했습니다.</ErrorMessage>
      </Container>
    );
  }

  // 데이터 처리
  const latestReport = data?.latest;
  const previousReports = data?.previous || [];
  const paginationData = data?.data || [];
  const totalCount = data?.totalCount || 0;

  // 표시할 리포트 결정
  const sortedReports = useLandingMode
    ? (latestReport ? [latestReport] : [])
    : paginationData;

  if (selectedSlug) {
    return (
      <BillsReportDetail
        slug={selectedSlug}
        onBack={handleBack}
      />
    );
  }

  return (
    <Container>
      <Header>
        <h1>📜 오늘의 발의 법안</h1>
        <p>가장 빠른 발의 법안 분석 정보</p>
      </Header>

      {sortedReports.length === 0 ? (
        <EmptyMessage>아직 발행된 리포트가 없습니다.</EmptyMessage>
      ) : (
        <>
          <ActionBar>
            <SelectInfo>
              {selectedReports.size > 0 ? `${selectedReports.size}개 선택됨` : '리포트를 선택하세요'}
            </SelectInfo>
            <ActionButtons>
              <ActionButton onClick={toggleSelectAll}>
                {selectedReports.size === sortedReports.length ? '전체 해제' : '전체 선택'}
              </ActionButton>
              <PrimaryButton onClick={handleCopyToClipboard} disabled={selectedReports.size === 0}>
                📋 복사
              </PrimaryButton>
            </ActionButtons>
          </ActionBar>

          {sortedReports.map((report) => (
            <ReportCard key={report.id} selected={selectedReports.has(report.id)}>
              <Checkbox
                type="checkbox"
                checked={selectedReports.has(report.id)}
                onChange={(e) => toggleReportSelection(report.id, e as any)}
                onClick={(e) => e.stopPropagation()}
              />
              <CardContent onClick={() => setSelectedSlug(report.slug)}>
                <CardHeader>
                  <CardTitle>{report.headline}</CardTitle>
                  <CardDate>{new Date(report.report_date).toLocaleDateString('ko-KR')}</CardDate>
                </CardHeader>

                <CardOverview>{report.overview}</CardOverview>

                <Statistics>
                  <StatBadge color="#dc2626">
                    🆕 신설 {report.statistics?.regulation?.new || 0}건
                  </StatBadge>
                  <StatBadge color="#d97706">
                    ⬆️ 강화 {report.statistics?.regulation?.strengthen || 0}건
                  </StatBadge>
                  <StatBadge color="#16a34a">
                    ⬇️ 완화 {report.statistics?.regulation?.relax || 0}건
                  </StatBadge>
                  <StatBadge color="#6b7280">
                    📘 비규제 {report.statistics?.regulation?.non_regulatory || 0}건
                  </StatBadge>
                </Statistics>

                {report.key_trends && report.key_trends.length > 0 && (
                  <TrendsList>
                    {report.key_trends.slice(0, 3).map((trend, idx) => (
                      <TrendItem key={idx}>{trend}</TrendItem>
                    ))}
                  </TrendsList>
                )}
              </CardContent>
            </ReportCard>
          ))}

          {/* 랜딩 모드: 이전 리포트 섹션 + 더 보기 버튼 */}
          {useLandingMode && previousReports.length > 0 && (
            <>
              <PreviousReportsSection>
                <SectionTitle>이전 리포트</SectionTitle>
                {previousReports.map((report) => (
                  <PreviousReportLink
                    key={report.id}
                    onClick={() => setSelectedSlug(report.slug)}
                  >
                    <PreviousReportDate>
                      {new Date(report.report_date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </PreviousReportDate>
                    <ViewDetailText>자세히 보기 →</ViewDetailText>
                  </PreviousReportLink>
                ))}
              </PreviousReportsSection>

              {/* 더 보기 버튼 - 디버깅용 로그 추가 */}
              {(() => {
                console.log('ViewMore Button Check:', { totalCount, shouldShow: totalCount > 5 });
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
        </>
      )}
    </Container>
  );
};

export default BillsReportsList;
