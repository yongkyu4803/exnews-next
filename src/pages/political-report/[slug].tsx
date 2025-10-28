/**
 * 정치 뉴스 리포트 상세 페이지
 *
 * /political-report/[slug] 경로로 접근
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import type { SupabaseNewsReport } from '@/types/political-report';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Pages:PoliticalReport');

// 동적 임포트
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;
const Alert = dynamic(() => import('antd/lib/alert'), { ssr: false }) as any;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const Card = styled.div`
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(to right, #1e40af, #3b82f6, #1e40af);
  color: white;
  padding: 32px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 24px 16px;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Meta = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 14px;
  opacity: 0.95;

  @media (max-width: 768px) {
    font-size: 13px;
    gap: 12px;
  }
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Content = styled.div`
  padding: 40px;

  @media (max-width: 768px) {
    padding: 24px 16px;
  }
`;

const Section = styled.section`
  margin-bottom: 40px;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    margin-bottom: 32px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 3px solid #3b82f6;

  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 16px;
  }
`;

const Summary = styled.div`
  background: #f8fafc;
  border-left: 4px solid #3b82f6;
  padding: 20px;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.7;
  color: #334155;

  @media (max-width: 768px) {
    font-size: 15px;
    padding: 16px;
  }
`;

const KeywordList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const KeywordBadge = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

  @media (max-width: 768px) {
    font-size: 13px;
    padding: 6px 12px;
  }
`;

const KeywordDesc = styled.p`
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
`;

const NewsSection = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const NewsSectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const ArticleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ArticleCard = styled.a`
  display: block;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }

  @media (max-width: 768px) {
    padding: 14px;
  }
`;

const ArticleTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const ArticleMeta = styled.div`
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 12px;
    gap: 8px;
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
  gap: 20px;
`;

const InsightCard = styled.div`
  background: #f8fafc;
  border-left: 4px solid #3b82f6;
  padding: 20px;
  border-radius: 8px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const InsightTitle = styled.h4`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;

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
  min-height: 100vh;
  color: white;
  font-size: 18px;
`;

const ErrorContainer = styled.div`
  max-width: 600px;
  margin: 40px auto;
  text-align: center;
`;

const BackButton = styled(Button)`
  margin-top: 20px;
`;

const PoliticalReportPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery<{ success: boolean; report: SupabaseNewsReport }>(
    ['politicalReport', slug],
    async () => {
      if (!slug || typeof slug !== 'string') {
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
      enabled: !!slug && isMounted,
      refetchOnWindowFocus: false
    }
  );

  if (!isMounted) {
    return <LoadingContainer>로딩 중...</LoadingContainer>;
  }

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
          <BackButton type="primary" onClick={() => router.back()}>
            돌아가기
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
    <>
      <Head>
        <title>{metadata.topic} - 정치 뉴스 리포트</title>
        <meta name="description" content={report.summary} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <Container>
        <Card>
          <Header>
            <Title>{metadata.topic}</Title>
            <Meta>
              <MetaItem>
                <span>📅</span>
                {formatDate(data.report.created_at)}
              </MetaItem>
              <MetaItem>
                <span>🏷️</span>
                {metadata.category}
              </MetaItem>
              <MetaItem>
                <span>📌</span>
                {metadata.period}
              </MetaItem>
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
                {report.keywords.map((kw, index) => (
                  <div key={index} style={{ marginBottom: '16px' }}>
                    <KeywordList>
                      <KeywordBadge>{kw.term}</KeywordBadge>
                    </KeywordList>
                    {kw.description && <KeywordDesc>{kw.description}</KeywordDesc>}
                  </div>
                ))}
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
                            <span>📰 {article.source}</span>
                            <span>📅 {article.date}</span>
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
              <Button type="primary" size="large" block onClick={() => router.back()}>
                목록으로 돌아가기
              </Button>
            </Section>
          </Content>
        </Card>
      </Container>
    </>
  );
};

export default PoliticalReportPage;
