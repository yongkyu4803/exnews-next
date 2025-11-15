import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import styled from '@emotion/styled';
import { ArrowLeftOutlined, CalendarOutlined, TagOutlined, FileTextOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';

const PoliticalReportDetail = dynamic(
  () => Promise.resolve(PoliticalReportDetailComponent),
  { ssr: false }
);

interface Keyword {
  term: string;
  description: string;
}

interface InsightItem {
  title: string;
  description: string;
}

interface Article {
  title: string;
  source: string;
  date: string;
  summary: string;
  url: string;
}

interface NewsSection {
  title: string;
  articles: Article[];
}

interface PoliticalReportData {
  metadata: {
    slug: string;
    topic: string;
    timestamp: string;
    category: string;
    period: string;
    keywords: string[];
    tags: string[];
  };
  summary: string;
  keywords: Keyword[];
  insights: {
    rulingParty?: InsightItem[];
    opposition?: InsightItem[];
    controversies?: InsightItem[];
    outlook?: InsightItem[];
  };
  newsSections: NewsSection[];
}

interface SupabasePoliticalReport {
  id: string;
  slug: string;
  topic: string;
  report_data: PoliticalReportData;
  created_at: string;
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
  background: linear-gradient(135deg, var(--gqai-primary) 0%, #2563eb 100%);
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

const Summary = styled.p`
  font-size: 16px;
  line-height: 1.8;
  color: var(--gqai-text-secondary);
  margin: 0;
`;

const KeywordsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const KeywordCard = styled.div`
  padding: 16px;
  background: var(--gqai-bg-secondary);
  border-radius: var(--gqai-radius-md);
  border-left: 4px solid var(--gqai-accent);
`;

const KeywordTerm = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: var(--gqai-text-primary);
  margin-bottom: 8px;
`;

const KeywordDesc = styled.div`
  font-size: 14px;
  color: var(--gqai-text-secondary);
  line-height: 1.6;
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InsightCard = styled.div<{ color: string; bgColor: string }>`
  padding: 20px;
  background: ${props => props.bgColor};
  border-radius: var(--gqai-radius-md);
  border-left: 4px solid ${props => props.color};
`;

const InsightHeader = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.color};
  margin-bottom: 16px;
`;

const InsightList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InsightItem = styled.div`
  padding: 12px;
  background: white;
  border-radius: var(--gqai-radius-sm);
`;

const InsightTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--gqai-text-primary);
  margin-bottom: 6px;
`;

const InsightDesc = styled.div`
  font-size: 13px;
  color: var(--gqai-text-secondary);
  line-height: 1.6;
`;

const NewsSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const NewsSectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--gqai-text-primary);
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--gqai-primary);
`;

const ArticlesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ArticleCard = styled.div`
  padding: 16px;
  background: var(--gqai-bg-secondary);
  border-radius: var(--gqai-radius-md);
  transition: all var(--gqai-transition-fast);

  &:hover {
    background: var(--gqai-bg-hover);
    box-shadow: var(--gqai-shadow-sm);
  }
`;

const ArticleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 12px;
`;

const ArticleTitle = styled.a`
  font-size: 15px;
  font-weight: 600;
  color: var(--gqai-text-primary);
  text-decoration: none;
  flex: 1;
  line-height: 1.4;

  &:hover {
    color: var(--gqai-primary);
    text-decoration: underline;
  }
`;

const ArticleMeta = styled.div`
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--gqai-text-tertiary);
  margin-bottom: 8px;
`;

const ArticleSummary = styled.p`
  font-size: 14px;
  color: var(--gqai-text-secondary);
  line-height: 1.6;
  margin: 0;
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

function PoliticalReportDetailComponent() {
  const router = useRouter();
  const { slug } = router.query;

  const { data: apiResponse, isLoading, error } = useQuery<{ success: boolean; report: SupabasePoliticalReport }>(
    ['political-report', slug],
    async () => {
      const response = await fetch(`/api/political-reports/${slug}`);
      if (!response.ok) {
        throw new Error('보고서를 불러올 수 없습니다');
      }
      return response.json();
    },
    {
      enabled: !!slug,
      staleTime: 5 * 60 * 1000,
    }
  );

  const supabaseReport = apiResponse?.report;
  const report = supabaseReport?.report_data;

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
            {error instanceof Error ? error.message : '보고서를 불러올 수 없습니다.'}
          </ErrorMessage>
          <BackButton onClick={() => router.push('/dashboard')}>
            <ArrowLeftOutlined />
            대시보드로 돌아가기
          </BackButton>
        </ErrorCard>
      </ErrorContainer>
    );
  }

  const insightCategories = [
    {
      key: 'rulingParty',
      title: '여당 입장',
      icon: '🔵',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      data: report?.insights?.rulingParty || [],
    },
    {
      key: 'opposition',
      title: '야당 입장',
      icon: '🔴',
      color: '#ef4444',
      bgColor: '#fef2f2',
      data: report?.insights?.opposition || [],
    },
    {
      key: 'controversies',
      title: '주요 논란',
      icon: '⚠️',
      color: '#f59e0b',
      bgColor: '#fef9c3',
      data: report?.insights?.controversies || [],
    },
    {
      key: 'outlook',
      title: '향후 전망',
      icon: '🔮',
      color: '#8b5cf6',
      bgColor: '#f3e8ff',
      data: report?.insights?.outlook || [],
    },
  ];

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
          <CategoryBadge>{report?.metadata?.category || '정치뉴스'}</CategoryBadge>
          <ReportTitle>{report?.metadata?.topic || '제목 없음'}</ReportTitle>
          <ReportMeta>
            <MetaItem>
              <CalendarOutlined />
              {report?.metadata?.timestamp
                ? new Date(report.metadata.timestamp).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '-'
              }
            </MetaItem>
            <MetaItem>
              <TagOutlined />
              {report?.metadata?.period || '-'}
            </MetaItem>
          </ReportMeta>
        </ReportHeader>

        <Section>
          <SectionTitle>
            <FileTextOutlined />
            요약
          </SectionTitle>
          <Summary>{report?.summary || '요약 정보가 없습니다.'}</Summary>
        </Section>

        {report?.keywords && report.keywords.length > 0 && (
          <Section>
            <SectionTitle>
              <TagOutlined />
              핵심 키워드
            </SectionTitle>
            <KeywordsGrid>
              {report.keywords.map((keyword, index) => (
                <KeywordCard key={index}>
                  <KeywordTerm>{keyword.term}</KeywordTerm>
                  <KeywordDesc>{keyword.description}</KeywordDesc>
                </KeywordCard>
              ))}
            </KeywordsGrid>
          </Section>
        )}

        <Section>
          <SectionTitle>주요 인사이트</SectionTitle>
          <InsightsGrid>
            {insightCategories.map((category) => (
              <InsightCard
                key={category.key}
                color={category.color}
                bgColor={category.bgColor}
              >
                <InsightHeader color={category.color}>
                  <span>{category.icon}</span>
                  {category.title}
                </InsightHeader>
                <InsightList>
                  {category.data.length > 0 ? (
                    category.data.map((item, index) => (
                      <InsightItem key={index}>
                        <InsightTitle>{item.title}</InsightTitle>
                        <InsightDesc>{item.description}</InsightDesc>
                      </InsightItem>
                    ))
                  ) : (
                    <InsightDesc style={{ padding: '12px', textAlign: 'center' }}>
                      데이터 없음
                    </InsightDesc>
                  )}
                </InsightList>
              </InsightCard>
            ))}
          </InsightsGrid>
        </Section>

        {report?.newsSections && report.newsSections.length > 0 && (
          <Section>
            <SectionTitle>관련 뉴스</SectionTitle>
            {report.newsSections.map((section, sectionIndex) => (
              <NewsSection key={sectionIndex}>
                <NewsSectionTitle>{section.title}</NewsSectionTitle>
                <ArticlesList>
                  {section.articles.map((article, articleIndex) => (
                    <ArticleCard key={articleIndex}>
                      <ArticleHeader>
                        <ArticleTitle
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {article.title}
                        </ArticleTitle>
                      </ArticleHeader>
                      <ArticleMeta>
                        <span>{article.source}</span>
                        <span>•</span>
                        <span>{article.date}</span>
                      </ArticleMeta>
                      <ArticleSummary>{article.summary}</ArticleSummary>
                    </ArticleCard>
                  ))}
                </ArticlesList>
              </NewsSection>
            ))}
          </Section>
        )}
      </Content>
    </Container>
  );
}

export default PoliticalReportDetail;
