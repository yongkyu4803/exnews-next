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

const ReportCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
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

const BillsReportsList: React.FC = () => {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

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
        onBack={() => setSelectedSlug(null)}
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
        sortedReports.map((report) => (
          <ReportCard key={report.id} onClick={() => setSelectedSlug(report.slug)}>
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
          </ReportCard>
        ))
      )}
    </Container>
  );
};

export default BillsReportsList;
