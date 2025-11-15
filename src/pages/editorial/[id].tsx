import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import styled from '@emotion/styled';
import { ArrowLeftOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';

const EditorialDetail = dynamic(
  () => Promise.resolve(EditorialDetailComponent),
  { ssr: false }
);

interface EditorialArticle {
  article_number: number;
  title: string;
  newspaper: string;
  published_date: string;
  summary: string;
  link: string;
}

interface EditorialTopic {
  topic_number: number;
  title: string;
  summary: string;
  articles: EditorialArticle[];
}

interface EditorialAnalysis {
  id: string;
  analyzed_at: string;
  title?: string;
  summary?: string;
  topics: EditorialTopic[];
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

const PageHeader = styled.div`
  padding: 32px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 16px;
  line-height: 1.3;
  font-family: var(--gqai-font-display);

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const PageMeta = styled.div`
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

const TopicCard = styled.div`
  padding: 24px;
  background: var(--gqai-bg-secondary);
  border-radius: var(--gqai-radius-lg);
  margin-bottom: 24px;
  border-left: 4px solid #ef4444;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TopicNumber = styled.div`
  display: inline-block;
  padding: 4px 12px;
  background: #ef4444;
  color: white;
  border-radius: var(--gqai-radius-sm);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const TopicTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: var(--gqai-text-primary);
  margin: 0 0 12px;
  line-height: 1.4;
`;

const TopicSummary = styled.p`
  font-size: 15px;
  line-height: 1.7;
  color: var(--gqai-text-secondary);
  margin: 0 0 20px;
`;

const ArticlesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ArticleCard = styled.div`
  padding: 16px;
  background: white;
  border-radius: var(--gqai-radius-md);
  border: 1px solid var(--gqai-border-light);
  transition: all var(--gqai-transition-fast);

  &:hover {
    border-color: var(--gqai-primary);
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

function EditorialDetailComponent() {
  const router = useRouter();
  const { id } = router.query;

  const { data: editorial, isLoading, error } = useQuery<EditorialAnalysis>(
    ['editorial', id],
    async () => {
      const response = await fetch(`/api/editorials/${id}`);
      if (!response.ok) {
        throw new Error('사설 분석을 불러올 수 없습니다');
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

  if (error || !editorial) {
    return (
      <ErrorContainer>
        <ErrorCard>
          <ErrorTitle>오류 발생</ErrorTitle>
          <ErrorMessage>
            {error instanceof Error ? error.message : '사설 분석을 불러올 수 없습니다.'}
          </ErrorMessage>
          <BackButton onClick={() => router.push('/dashboard')}>
            <ArrowLeftOutlined />
            대시보드로 돌아가기
          </BackButton>
        </ErrorCard>
      </ErrorContainer>
    );
  }

  const topicCount = editorial.topics?.length || 0;
  const articleCount = editorial.topics?.reduce((sum, topic) => sum + (topic.articles?.length || 0), 0) || 0;

  return (
    <Container>
      <Header>
        <BackButton onClick={() => router.push('/dashboard')}>
          <ArrowLeftOutlined />
          대시보드로 돌아가기
        </BackButton>
      </Header>

      <Content>
        <PageHeader>
          <CategoryBadge>사설 분석</CategoryBadge>
          <PageTitle>
            {editorial.title || `${new Date(editorial.analyzed_at).toLocaleDateString('ko-KR')} 사설 분석`}
          </PageTitle>
          <PageMeta>
            <MetaItem>
              <CalendarOutlined />
              {new Date(editorial.analyzed_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </MetaItem>
            <MetaItem>
              <FileTextOutlined />
              {topicCount}개 주제 · {articleCount}개 사설
            </MetaItem>
          </PageMeta>
        </PageHeader>

        {editorial.summary && (
          <Section>
            <SectionTitle>
              <FileTextOutlined />
              전체 요약
            </SectionTitle>
            <Summary>{editorial.summary}</Summary>
          </Section>
        )}

        <Section>
          <SectionTitle>주제별 분석</SectionTitle>
          {editorial.topics && editorial.topics.length > 0 ? (
            editorial.topics.map((topic, topicIndex) => (
              <TopicCard key={topicIndex}>
                <TopicNumber>주제 {topic.topic_number}</TopicNumber>
                <TopicTitle>{topic.title}</TopicTitle>
                <TopicSummary>{topic.summary}</TopicSummary>
                
                {topic.articles && topic.articles.length > 0 && (
                  <>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--gqai-text-primary)',
                      marginBottom: 12,
                    }}>
                      관련 사설 ({topic.articles.length})
                    </div>
                    <ArticlesList>
                      {topic.articles.map((article, articleIndex) => (
                        <ArticleCard key={articleIndex}>
                          <ArticleHeader>
                            <ArticleTitle
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {article.title}
                            </ArticleTitle>
                          </ArticleHeader>
                          <ArticleMeta>
                            <span>{article.newspaper}</span>
                            <span>•</span>
                            <span>{article.published_date}</span>
                          </ArticleMeta>
                          <ArticleSummary>{article.summary}</ArticleSummary>
                        </ArticleCard>
                      ))}
                    </ArticlesList>
                  </>
                )}
              </TopicCard>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-secondary)' }}>
              분석된 주제가 없습니다.
            </div>
          )}
        </Section>
      </Content>
    </Container>
  );
}

export default EditorialDetail;
