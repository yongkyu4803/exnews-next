/**
 * 정치 뉴스 리포트 상세 컴포넌트
 *
 * 단일 리포트의 상세 내용을 표시합니다.
 */

import React from 'react';
import { useQuery } from 'react-query';
import styled from '@emotion/styled';
import dynamic from 'next/dynamic';
import type { SupabaseNewsReport } from '@/types/political-report';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Component:PoliticalReportDetail');

// 동적 임포트
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;
const Alert = dynamic(() => import('antd/lib/alert'), { ssr: false }) as any;

const Container = styled.div`
  padding: 0;
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: 0;
  }
`;

const Header = styled.div`
  background: linear-gradient(to right, #1e40af, #3b82f6, #1e40af);
  color: white;
  padding: 16px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 12px 8px;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 6px 0;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Meta = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
  opacity: 0.95;

  @media (max-width: 768px) {
    font-size: 13px;
    gap: 6px;
  }
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Content = styled.div`
  padding: 20px;

  @media (max-width: 768px) {
    padding: 12px 8px;
  }
`;

const Section = styled.section`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 10px 0;
  padding-bottom: 6px;
  border-bottom: 3px solid #3b82f6;

  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 8px;
  }
`;

const Summary = styled.div`
  background: #f8fafc;
  border-left: 4px solid #3b82f6;
  padding: 10px;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.7;
  color: #334155;

  @media (max-width: 768px) {
    font-size: 15px;
    padding: 8px;
  }
`;

const KeywordList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
`;

const KeywordCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  @media (max-width: 768px) {
    padding: 8px;
  }
`;

const KeywordTerm = styled.div`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;

  @media (max-width: 768px) {
    font-size: 15px;
    margin-bottom: 4px;
  }
`;

const KeywordDesc = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const NewsSection = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const NewsSectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const ArticleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ArticleCard = styled.a`
  display: block;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }

  @media (max-width: 768px) {
    padding: 7px;
  }
`;

const ArticleTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const ArticleMeta = styled.div`
  display: flex;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;

  @media (max-width: 768px) {
    font-size: 12px;
    gap: 4px;
  }
`;

const ArticleSummary = styled.p`
  font-size: 14px;
  color: #475569;
  margin: 0;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const InsightList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InsightCard = styled.div`
  background: #f8fafc;
  border-left: 4px solid #3b82f6;
  padding: 10px;
  border-radius: 8px;

  @media (max-width: 768px) {
    padding: 8px;
  }
`;

const InsightTitle = styled.h4`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const InsightDesc = styled.p`
  font-size: 15px;
  color: #475569;
  margin: 0;
  line-height: 1.7;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #64748b;
  font-size: 16px;
`;

const ErrorContainer = styled.div`
  max-width: 600px;
  margin: 20px auto;
  text-align: center;
  padding: 10px;
`;

const BackButton = styled(Button)`
  margin-top: 10px;
`;

interface PoliticalReportDetailProps {
  slug: string;
  onBack: () => void;
}

const PoliticalReportDetail: React.FC<PoliticalReportDetailProps> = ({ slug, onBack }) => {
  const { data, isLoading, error } = useQuery<{ success: boolean; report: SupabaseNewsReport }>(
    ['politicalReport', slug],
    async () => {
      if (!slug) {
        throw new Error('Invalid slug');
      }
      logger.info('정치 리포트 상세 요청', { slug });
      const response = await fetch(`/api/political-reports/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      const result = await response.json();
      logger.info('정치 리포트 상세 요청 완료', { slug });
      return result;
    },
    {
      enabled: !!slug,
      refetchOnWindowFocus: false
    }
  );

  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>리포트를 불러오는 중...</LoadingContainer>
      </Container>
    );
  }

  if (error || !data?.success) {
    return (
      <Container>
        <ErrorContainer>
          <Alert
            message="리포트를 불러올 수 없습니다"
            description={error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
            type="error"
            showIcon
          />
          <BackButton type="primary" onClick={onBack}>
            목록으로 돌아가기
          </BackButton>
        </ErrorContainer>
      </Container>
    );
  }

  const report = data.report.report_data;
  const metadata = report.metadata;

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Container>
      <Header>
        <Title>{metadata.topic}</Title>
        <Meta>
          <MetaItem>
            {formatDate(data.report.created_at)}
          </MetaItem>
          {/* <MetaItem>|</MetaItem>
          <MetaItem>
            {metadata.category}
          </MetaItem>
          <MetaItem>|</MetaItem>
          <MetaItem>
            {metadata.period}
          </MetaItem> */}
        </Meta>
      </Header>

      <Content>
        {/* 요약 */}
        <Section>
          <SectionTitle>📋 요약</SectionTitle>
          <Summary>{report.summary}</Summary>
        </Section>

        {/* 키워드 */}
        {report.keywords && report.keywords.length > 0 && (
          <Section>
            <SectionTitle>🔑 핵심 키워드</SectionTitle>
            <KeywordList>
              {report.keywords.map((kw, index) => (
                <KeywordCard key={index}>
                  <KeywordTerm>{kw.term}</KeywordTerm>
                  {kw.description && <KeywordDesc>{kw.description}</KeywordDesc>}
                </KeywordCard>
              ))}
            </KeywordList>
          </Section>
        )}

        {/* 뉴스 섹션 */}
        {report.newsSections && report.newsSections.length > 0 && (
          <Section>
            <SectionTitle>📰 주요 기사</SectionTitle>
            {report.newsSections.map((section, sectionIdx) => (
              <NewsSection key={sectionIdx}>
                <NewsSectionTitle>{section.title}</NewsSectionTitle>
                <ArticleList>
                  {section.articles.map((article, articleIdx) => (
                    <ArticleCard
                      key={articleIdx}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ArticleTitle>{article.title}</ArticleTitle>
                      <ArticleMeta>
                        <span>{article.source}</span>
                        <span>|</span>
                        <span>{article.date}</span>
                      </ArticleMeta>
                      <ArticleSummary>{article.summary}</ArticleSummary>
                    </ArticleCard>
                  ))}
                </ArticleList>
              </NewsSection>
            ))}
          </Section>
        )}

        {/* 정치 분석 */}
        {report.insights && (
          <>
            {report.insights.rulingParty && report.insights.rulingParty.length > 0 && (
              <Section>
                <SectionTitle>🏛️ 여당 동향</SectionTitle>
                <InsightList>
                  {report.insights.rulingParty.map((item, idx) => (
                    <InsightCard key={idx}>
                      <InsightTitle>{item.title}</InsightTitle>
                      <InsightDesc>{item.description}</InsightDesc>
                    </InsightCard>
                  ))}
                </InsightList>
              </Section>
            )}

            {report.insights.opposition && report.insights.opposition.length > 0 && (
              <Section>
                <SectionTitle>🗳️ 야당 동향</SectionTitle>
                <InsightList>
                  {report.insights.opposition.map((item, idx) => (
                    <InsightCard key={idx}>
                      <InsightTitle>{item.title}</InsightTitle>
                      <InsightDesc>{item.description}</InsightDesc>
                    </InsightCard>
                  ))}
                </InsightList>
              </Section>
            )}

            {report.insights.controversies && report.insights.controversies.length > 0 && (
              <Section>
                <SectionTitle>⚠️ 주요 쟁점</SectionTitle>
                <InsightList>
                  {report.insights.controversies.map((item, idx) => (
                    <InsightCard key={idx}>
                      <InsightTitle>{item.title}</InsightTitle>
                      <InsightDesc>{item.description}</InsightDesc>
                    </InsightCard>
                  ))}
                </InsightList>
              </Section>
            )}

            {report.insights.outlook && report.insights.outlook.length > 0 && (
              <Section>
                <SectionTitle>🔮 전망</SectionTitle>
                <InsightList>
                  {report.insights.outlook.map((item, idx) => (
                    <InsightCard key={idx}>
                      <InsightTitle>{item.title}</InsightTitle>
                      <InsightDesc>{item.description}</InsightDesc>
                    </InsightCard>
                  ))}
                </InsightList>
              </Section>
            )}
          </>
        )}

        {/* 돌아가기 버튼 */}
        <Section>
          <Button type="primary" size="large" block onClick={onBack}>
            목록으로 돌아가기
          </Button>
        </Section>
      </Content>
    </Container>
  );
};

export default PoliticalReportDetail;
