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

  // 카카오톡 공유
  const handleShareKakao = async () => {
    if (selectedReports.size === 0) {
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((msg) => {
          msg.default.info('선택된 리포트가 없습니다.');
        });
      }
      return;
    }

    const selectedData = sortedReports.filter(r => selectedReports.has(r.id));

    // 카카오톡용 텍스트 (복사 기능과 동일한 형식)
    const shareText = `[가장빠른 법안분석 정보 - 어제 발의된 법안]\n\n` +
      selectedData.map(report => {
        const regStats = report.statistics?.regulation;
        const classification = `신설 ${regStats?.new || 0}건, 강화 ${regStats?.strengthen || 0}건, 완화 ${regStats?.relax || 0}건`;
        const pageUrl = `${window.location.origin}/?tab=bills&id=${report.slug}`;

        return `${report.headline}\n\n요약: ${report.overview || '요약 없음'}\n\n법안분류: ${classification}\n\n상세보기: ${pageUrl}\n`;
      }).join('\n---\n\n');

    // 첫 번째 리포트의 URL (카카오톡 링크용)
    const firstReportUrl = `${window.location.origin}/?tab=bills&id=${selectedData[0].slug}`;

    if (typeof window !== 'undefined' && (window as any).Kakao) {
      try {
        (window as any).Kakao.Share.sendDefault({
          objectType: 'text',
          text: shareText,
          link: {
            mobileWebUrl: firstReportUrl,
            webUrl: firstReportUrl,
          },
        });
      } catch (error) {
        // 카카오톡 공유 실패 시 클립보드 복사
        await navigator.clipboard.writeText(shareText);
        if (typeof window !== 'undefined') {
          import('antd/lib/message').then((msg) => {
            msg.default.success('카카오톡 공유 대신 클립보드에 복사되었습니다.');
          });
        }
      }
    } else {
      // 카카오톡 SDK가 없으면 클립보드 복사
      try {
        await navigator.clipboard.writeText(shareText);
        if (typeof window !== 'undefined') {
          import('antd/lib/message').then((msg) => {
            msg.default.success('클립보드에 복사되었습니다. 카카오톡에 붙여넣기 하세요.');
          });
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          import('antd/lib/message').then((msg) => {
            msg.default.error('복사에 실패했습니다.');
          });
        }
      }
    }
  };

  const { data, isLoading, error } = useQuery<{ data: BillsReport[] }>(
    'billsReports',
    async () => {
      const res = await fetch('/api/bills');
      const json = await res.json();
      console.log('Bills API Response:', json);
      return json;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5분
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

  const reports = data?.data || [];

  // 날짜 기준으로 최신순 정렬 (클라이언트 사이드에서 보장)
  const sortedReports = [...reports].sort((a, b) => {
    const dateA = new Date(a.report_date).getTime();
    const dateB = new Date(b.report_date).getTime();
    return dateB - dateA; // 내림차순 (최신이 먼저)
  });

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
        </>
      )}
    </Container>
  );
};

export default BillsReportsList;
