/**
 * 법안 모니터링 리포트 상세 컴포넌트
 */

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useQuery } from 'react-query';
import type { BillsReportWithBills, BillItem, RegulationType } from '@/types/bills';
import { REGULATION_TYPE_LABELS, REGULATION_TYPE_COLORS } from '@/types/bills';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 0;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const Header = styled.div`
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
`;

const ReportDate = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const ReportTitle = styled.h1`
  font-family: 'Anemone', sans-serif;
  font-size: 28px;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const ReportOverview = styled.p`
  font-size: 15px;
  color: #4b5563;
  line-height: 1.7;
  margin-bottom: 20px;
`;

const StatisticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div<{ color: string }>`
  background: ${props => props.color}10;
  border: 2px solid ${props => props.color}40;
  border-radius: 12px;
  padding: 16px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const StatLabel = styled.div<{ color: string }>`
  font-size: 13px;
  color: ${props => props.color};
  font-weight: 600;
  margin-bottom: 8px;
`;

const StatValue = styled.div<{ color: string }>`
  font-size: 28px;
  font-weight: bold;
  color: ${props => props.color};

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const TrendsSection = styled.div`
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const TrendItem = styled.div`
  font-size: 14px;
  color: #374151;
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
  line-height: 1.6;

  &:before {
    content: '•';
    position: absolute;
    left: 0;
    color: #3b82f6;
    font-weight: bold;
  }

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const BillsSection = styled.div`
  margin-bottom: 32px;
`;

const BillsSectionHeader = styled.div<{ color: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.color};
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 12px;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const SectionHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionHeaderTitle = styled.h3<{ textColor: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.textColor};
  margin: 0;

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const BillCount = styled.span<{ textColor: string }>`
  font-size: 14px;
  color: ${props => props.textColor};
  opacity: 0.8;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const ToggleIcon = styled.span<{ textColor: string }>`
  color: ${props => props.textColor};
  font-size: 20px;
`;

const BillsList = styled.div`
  display: grid;
  gap: 12px;
`;

const BillCard = styled.div<{ bgColor: string; borderColor: string }>`
  background: ${props => props.bgColor};
  border: 1px solid ${props => props.borderColor};
  border-radius: 8px;
  padding: 16px;
  transition: transform 0.2s;

  &:hover {
    transform: translateX(4px);
  }

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const BillName = styled.h4<{ textColor: string }>`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.textColor};
  margin: 0 0 8px 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const BillMeta = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

const BillSummary = styled.div`
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 8px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const BillExplanation = styled.div`
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  padding-left: 12px;
  border-left: 3px solid #e5e7eb;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const AffectedGroups = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

const AffectedGroupLabel = styled.span`
  color: #9ca3af;
  font-weight: 400;
  margin-right: 4px;
`;

const AffectedGroupTag = styled.span`
  color: #6b7280;
  font-weight: 400;
  margin-right: 6px;

  &:not(:last-child)::after {
    content: ',';
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

interface BillsReportDetailProps {
  slug: string;
  onBack: () => void;
}

const BillsReportDetail: React.FC<BillsReportDetailProps> = ({ slug, onBack }) => {
  const [expandedSections, setExpandedSections] = useState<Set<RegulationType>>(
    new Set<RegulationType>(['신설', '강화', '완화', '비규제'])
  );

  const { data, isLoading, error } = useQuery<{ data: BillsReportWithBills }>(
    ['billsReport', slug],
    () => fetch(`/api/bills/${slug}`).then(res => res.json()),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );

  const toggleSection = (type: RegulationType) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedSections(newExpanded);
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingMessage>리포트를 불러오는 중...</LoadingMessage>
      </Container>
    );
  }

  if (error || !data?.data) {
    return (
      <Container>
        <BackButton onClick={onBack}>← 목록으로</BackButton>
        <ErrorMessage>리포트를 불러오는데 실패했습니다.</ErrorMessage>
      </Container>
    );
  }

  const report = data.data;
  const billsByType: Record<RegulationType, BillItem[]> = {
    '신설': [],
    '강화': [],
    '완화': [],
    '비규제': [],
  };

  report.bills.forEach(bill => {
    // regulation_affected_groups 데이터 확인
    if (bill.regulation_affected_groups) {
      console.log('영향 대상 데이터:', bill.bill_name, bill.regulation_affected_groups);
    }

    // regulation_type이 null이면 비규제로 처리
    const type = bill.regulation_type || '비규제';
    billsByType[type].push(bill);
  });

  // 실제 법안 개수로 통계 계산
  const actualStats = {
    new: billsByType['신설'].length,
    strengthened: billsByType['강화'].length,
    relaxed: billsByType['완화'].length,
    non_regulatory: billsByType['비규제'].length,
  };

  return (
    <Container>
      <BackButton onClick={onBack}>← 목록으로</BackButton>

      <Header>
        <ReportDate>{new Date(report.report_date).toLocaleDateString('ko-KR')}</ReportDate>
        <ReportTitle>{report.headline}</ReportTitle>
        <ReportOverview>{report.overview}</ReportOverview>
      </Header>

      <StatisticsGrid>
        <StatCard color="#dc2626">
          <StatLabel color="#dc2626">🆕 신설 규제</StatLabel>
          <StatValue color="#dc2626">{actualStats.new}</StatValue>
        </StatCard>
        <StatCard color="#d97706">
          <StatLabel color="#d97706">⬆️ 강화 규제</StatLabel>
          <StatValue color="#d97706">{actualStats.strengthened}</StatValue>
        </StatCard>
        <StatCard color="#16a34a">
          <StatLabel color="#16a34a">⬇️ 완화 규제</StatLabel>
          <StatValue color="#16a34a">{actualStats.relaxed}</StatValue>
        </StatCard>
        <StatCard color="#6b7280">
          <StatLabel color="#6b7280">📘 비규제</StatLabel>
          <StatValue color="#6b7280">{actualStats.non_regulatory}</StatValue>
        </StatCard>
      </StatisticsGrid>

      {report.key_trends && report.key_trends.length > 0 && (
        <TrendsSection>
          <SectionTitle>🎯 주요 트렌드</SectionTitle>
          {report.key_trends.map((trend, idx) => (
            <TrendItem key={idx}>{trend}</TrendItem>
          ))}
        </TrendsSection>
      )}

      {(['신설', '강화', '완화', '비규제'] as RegulationType[]).map(type => {
        const bills = billsByType[type];
        if (bills.length === 0) return null;

        const colors = REGULATION_TYPE_COLORS[type];
        const isExpanded = expandedSections.has(type);

        return (
          <BillsSection key={type}>
            <BillsSectionHeader
              color={colors.bg}
              onClick={() => toggleSection(type)}
            >
              <SectionHeaderLeft>
                <SectionHeaderTitle textColor={colors.text}>
                  {REGULATION_TYPE_LABELS[type]} 법안
                </SectionHeaderTitle>
                <BillCount textColor={colors.text}>({bills.length}건)</BillCount>
              </SectionHeaderLeft>
              <ToggleIcon textColor={colors.text}>
                {isExpanded ? '▼' : '▶'}
              </ToggleIcon>
            </BillsSectionHeader>

            {isExpanded && (
              <BillsList>
                {bills.map(bill => (
                  <BillCard
                    key={bill.id}
                    bgColor={colors.bg}
                    borderColor={colors.border}
                  >
                    <BillName textColor={colors.text}>{bill.bill_name}</BillName>
                    <BillMeta>
                      <span>제안자: {bill.proposer}</span>
                      <span>•</span>
                      <span>의안번호: {bill.bill_no}</span>
                      {bill.domain && (
                        <>
                          <span>•</span>
                          <span>분야: {bill.domain}</span>
                        </>
                      )}
                    </BillMeta>
                    {bill.summary_one_sentence && (
                      <BillSummary>{bill.summary_one_sentence}</BillSummary>
                    )}
                    {bill.summary_easy_explanation && (
                      <BillExplanation>{bill.summary_easy_explanation}</BillExplanation>
                    )}
                    {bill.regulation_affected_groups && (
                      <AffectedGroups>
                        <AffectedGroupLabel>영향 대상:</AffectedGroupLabel>
                        {Array.isArray(bill.regulation_affected_groups) ? (
                          bill.regulation_affected_groups.map((group: string, idx: number) => (
                            <AffectedGroupTag key={idx}>#{group.replace(/\s+/g, '')}</AffectedGroupTag>
                          ))
                        ) : (
                          <AffectedGroupTag>#{String(bill.regulation_affected_groups).replace(/\s+/g, '')}</AffectedGroupTag>
                        )}
                      </AffectedGroups>
                    )}
                  </BillCard>
                ))}
              </BillsList>
            )}
          </BillsSection>
        );
      })}
    </Container>
  );
};

export default BillsReportDetail;
