import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import styled from '@emotion/styled';
import { ArrowLeftOutlined, CalendarOutlined, FileTextOutlined, BarChartOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';

const BillsReportDetail = dynamic(
  () => Promise.resolve(BillsReportDetailComponent),
  { ssr: false }
);

interface BillItem {
  id: string;
  bill_id: string;
  bill_no: string;
  bill_name: string;
  proposer: string;
  proposal_date: string;
  committee: string | null;
  link_url: string | null;
  domain: string | null;
  regulation_type: '신설' | '강화' | '완화' | null;
  summary_one_sentence: string | null;
  summary_easy_explanation: string | null;
  summary_why_important: string | null;
  summary_who_affected: string | null;
}

interface BillsReport {
  id: string;
  slug: string;
  report_date: string;
  headline: string;
  overview: string;
  total_bills: number;
  key_trends: string[];
  statistics: {
    domain?: Record<string, number>;
    regulation?: Record<string, number>;
    classification?: Record<string, number>;
  };
  bills?: BillItem[];
}

const Container = styled.div`
  min-height: 100vh;
  background: var(--gqai-bg-primary);
  padding: 24px 16px;

  @media (max-width: 768px) {
    padding: 16px 8px;
  }
`;

const Header = styled.div`
  max-width: 1200px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid var(--gqai-border);
  border-radius: var(--gqai-radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--gqai-text-primary);
  transition: all var(--gqai-transition-fast);

  &:hover {
    background: var(--gqai-bg-hover);
    border-color: var(--gqai-primary);
  }
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: var(--gqai-radius-lg);
  box-shadow: var(--gqai-shadow-lg);
  overflow: hidden;
`;

const ReportHeader = styled.div`
  padding: 32px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;

  @media (max-width: 768px) {
    padding: 24px 16px;
  }
`;

const CategoryBadge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--gqai-radius-sm);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const ReportTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 16px;
  line-height: 1.3;
  font-family: var(--gqai-font-display);

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const ReportMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 14px;
  opacity: 0.95;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Section = styled.section`
  padding: 32px;
  border-bottom: 1px solid var(--gqai-border);

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    padding: 24px 16px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: var(--gqai-text-primary);
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--gqai-font-display);
`;

const Overview = styled.p`
  font-size: 16px;
  line-height: 1.8;
  color: var(--gqai-text-secondary);
  margin: 0;
`;

const TrendsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TrendItem = styled.div`
  padding: 16px;
  background: var(--gqai-bg-secondary);
  border-radius: var(--gqai-radius-md);
  border-left: 4px solid #10b981;
  font-size: 15px;
  line-height: 1.6;
  color: var(--gqai-text-secondary);
`;

const StatisticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const StatCard = styled.div`
  padding: 20px;
  background: var(--gqai-bg-secondary);
  border-radius: var(--gqai-radius-md);
`;

const StatTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--gqai-text-primary);
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: var(--gqai-radius-sm);
  font-size: 14px;
`;

const StatLabel = styled.span`
  color: var(--gqai-text-secondary);
`;

const StatValue = styled.span`
  font-weight: 600;
  color: var(--gqai-text-primary);
`;

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gqai-bg-primary);
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid var(--gqai-border);
  border-top-color: var(--gqai-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gqai-bg-primary);
`;

const ErrorCard = styled.div`
  padding: 32px;
  background: white;
  border-radius: var(--gqai-radius-lg);
  box-shadow: var(--gqai-shadow-lg);
  text-align: center;
  max-width: 500px;
`;

const ErrorTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: var(--gqai-text-primary);
  margin: 0 0 12px;
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  color: var(--gqai-text-secondary);
  margin: 0 0 24px;
`;

const BillsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BillCard = styled.div`
  padding: 20px;
  background: white;
  border: 1px solid var(--gqai-border-light);
  border-radius: var(--gqai-radius-md);
  transition: all var(--gqai-transition-fast);

  &:hover {
    border-color: var(--gqai-primary);
    box-shadow: var(--gqai-shadow-sm);
  }
`;

const BillHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
`;

const BillTitle = styled.a`
  font-size: 16px;
  font-weight: 600;
  color: var(--gqai-text-primary);
  text-decoration: none;
  flex: 1;
  line-height: 1.5;

  &:hover {
    color: var(--gqai-primary);
    text-decoration: underline;
  }
`;

const RegulationBadge = styled.span<{ type: string }>`
  padding: 4px 10px;
  border-radius: var(--gqai-radius-sm);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background: ${props =>
    props.type === '신설' ? '#fef2f2' :
    props.type === '강화' ? '#fffbeb' :
    props.type === '완화' ? '#f0fdf4' : '#f9fafb'
  };
  color: ${props =>
    props.type === '신설' ? '#dc2626' :
    props.type === '강화' ? '#d97706' :
    props.type === '완화' ? '#16a34a' : '#6b7280'
  };
  border: 1px solid ${props =>
    props.type === '신설' ? '#fecaca' :
    props.type === '강화' ? '#fde68a' :
    props.type === '완화' ? '#bbf7d0' : '#e5e7eb'
  };
`;

const BillMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--gqai-text-tertiary);
  margin-bottom: 12px;
`;

const BillSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SummaryItem = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: var(--gqai-text-secondary);
`;

const SummaryLabel = styled.span`
  font-weight: 600;
  color: var(--gqai-text-primary);
  margin-right: 8px;
`;

function BillsReportDetailComponent() {
  const router = useRouter();
  const { id } = router.query;

  const { data: report, isLoading, error } = useQuery<BillsReport>(
    ['bills-report', id],
    async () => {
      const response = await fetch(`/api/bills/${id}`);
      if (!response.ok) {
        throw new Error('법안 리포트를 불러올 수 없습니다');
      }
      return response.json();
    },
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  );

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    );
  }

  if (error || !report) {
    return (
      <ErrorContainer>
        <ErrorCard>
          <ErrorTitle>오류 발생</ErrorTitle>
          <ErrorMessage>
            {error instanceof Error ? error.message : '법안 리포트를 불러올 수 없습니다.'}
          </ErrorMessage>
          <BackButton onClick={() => router.push('/dashboard')}>
            <ArrowLeftOutlined />
            대시보드로 돌아가기
          </BackButton>
        </ErrorCard>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => router.push('/dashboard')}>
          <ArrowLeftOutlined />
          대시보드로 돌아가기
        </BackButton>
      </Header>

      <Content>
        <ReportHeader>
          <CategoryBadge>법안 발의 동향</CategoryBadge>
          <ReportTitle>{report.headline}</ReportTitle>
          <ReportMeta>
            <MetaItem>
              <CalendarOutlined />
              {new Date(report.report_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </MetaItem>
            <MetaItem>
              <FileTextOutlined />
              총 {report.total_bills}건 발의
            </MetaItem>
          </ReportMeta>
        </ReportHeader>

        <Section>
          <SectionTitle>
            <FileTextOutlined />
            분석 요약
          </SectionTitle>
          <Overview>{report.overview}</Overview>
        </Section>

        {report.key_trends && report.key_trends.length > 0 && (
          <Section>
            <SectionTitle>주요 동향</SectionTitle>
            <TrendsList>
              {report.key_trends.map((trend, index) => (
                <TrendItem key={index}>{trend}</TrendItem>
              ))}
            </TrendsList>
          </Section>
        )}

        {report.statistics && (
          <Section>
            <SectionTitle>
              <BarChartOutlined />
              통계 분석
            </SectionTitle>
            <StatisticsGrid>
              {report.statistics.domain && Object.keys(report.statistics.domain).length > 0 && (
                <StatCard>
                  <StatTitle>분야별 분포</StatTitle>
                  <StatList>
                    {Object.entries(report.statistics.domain)
                      .sort(([, a], [, b]) => b - a)
                      .map(([domain, count]) => (
                        <StatItem key={domain}>
                          <StatLabel>{domain}</StatLabel>
                          <StatValue>{count}건</StatValue>
                        </StatItem>
                      ))}
                  </StatList>
                </StatCard>
              )}

              {report.statistics.regulation && Object.keys(report.statistics.regulation).length > 0 && (
                <StatCard>
                  <StatTitle>규제 유형</StatTitle>
                  <StatList>
                    {Object.entries(report.statistics.regulation)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <StatItem key={type}>
                          <StatLabel>{type}</StatLabel>
                          <StatValue>{count}건</StatValue>
                        </StatItem>
                      ))}
                  </StatList>
                </StatCard>
              )}

              {report.statistics.classification && Object.keys(report.statistics.classification).length > 0 && (
                <StatCard>
                  <StatTitle>법안 분류</StatTitle>
                  <StatList>
                    {Object.entries(report.statistics.classification)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <StatItem key={type}>
                          <StatLabel>{type}</StatLabel>
                          <StatValue>{count}건</StatValue>
                        </StatItem>
                      ))}
                  </StatList>
                </StatCard>
              )}
            </StatisticsGrid>
          </Section>
        )}

        {report.bills && report.bills.length > 0 && (
          <Section>
            <SectionTitle>
              <FileTextOutlined />
              법안 상세 목록 ({report.bills.length}건)
            </SectionTitle>
            <BillsList>
              {report.bills.map((bill, index) => (
                <BillCard key={bill.id}>
                  <BillHeader>
                    {bill.link_url ? (
                      <BillTitle
                        href={bill.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {bill.bill_name}
                      </BillTitle>
                    ) : (
                      <div style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: 'var(--gqai-text-primary)',
                        flex: 1,
                        lineHeight: 1.5
                      }}>
                        {bill.bill_name}
                      </div>
                    )}
                    {bill.regulation_type && (
                      <RegulationBadge type={bill.regulation_type}>
                        {bill.regulation_type}
                      </RegulationBadge>
                    )}
                  </BillHeader>

                  <BillMeta>
                    <span>📋 {bill.bill_no}</span>
                    <span>•</span>
                    <span>👤 {bill.proposer}</span>
                    {bill.committee && (
                      <>
                        <span>•</span>
                        <span>🏛️ {bill.committee}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>📅 {new Date(bill.proposal_date).toLocaleDateString('ko-KR')}</span>
                  </BillMeta>

                  {(bill.summary_one_sentence || bill.summary_easy_explanation ||
                    bill.summary_why_important || bill.summary_who_affected) && (
                    <BillSummary>
                      {bill.summary_one_sentence && (
                        <SummaryItem>
                          <SummaryLabel>📌 한 줄 요약:</SummaryLabel>
                          {bill.summary_one_sentence}
                        </SummaryItem>
                      )}
                      {bill.summary_easy_explanation && (
                        <SummaryItem>
                          <SummaryLabel>💡 쉬운 설명:</SummaryLabel>
                          {bill.summary_easy_explanation}
                        </SummaryItem>
                      )}
                      {bill.summary_why_important && (
                        <SummaryItem>
                          <SummaryLabel>⭐ 중요한 이유:</SummaryLabel>
                          {bill.summary_why_important}
                        </SummaryItem>
                      )}
                      {bill.summary_who_affected && (
                        <SummaryItem>
                          <SummaryLabel>👥 영향 받는 사람:</SummaryLabel>
                          {bill.summary_who_affected}
                        </SummaryItem>
                      )}
                    </BillSummary>
                  )}
                </BillCard>
              ))}
            </BillsList>
          </Section>
        )}
      </Content>
    </Container>
  );
}

export default BillsReportDetail;
