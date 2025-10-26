import React, { useState } from 'react';
import styled from '@emotion/styled';
import { EditorialAnalysis } from '@/types';

const Container = styled.div`
  width: 100%;
  padding: 4px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AnalysisCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  height: fit-content;
`;

const CardHeader = styled.div`
  margin-bottom: 8px;
`;

const QueryText = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #1a1a1a;
  margin: 0 0 4px 0;
`;

const DateText = styled.div`
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
`;

const TopicSection = styled.div`
  margin-top: 8px;
`;

const TopicHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
`;

const TopicNumber = styled.div`
  min-width: 20px;
  height: 20px;
  border-radius: 4px;
  background: #e8f0fe;
  color: #1a73e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 11px;
  flex-shrink: 0;
`;

const TopicTitle = styled.h4`
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  flex: 1;
  line-height: 1.4;
`;

const ExpandIcon = styled.span<{ expanded: boolean }>`
  font-size: 20px;
  color: #1a73e8;
  font-weight: bold;
  transition: transform 0.2s ease;
  line-height: 1;
`;

const TopicSummary = styled.p`
  font-size: 13px;
  line-height: 1.5;
  color: #555;
  margin: 6px 0 8px 28px;
  white-space: pre-wrap;
  background: #f8f9fa;
  padding: 8px 10px;
  border-radius: 6px;
`;

const ArticlesList = styled.div`
  margin-left: 28px;
`;

const ArticleItem = styled.a`
  display: block;
  padding: 8px 10px;
  margin-bottom: 6px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;

  &:active {
    background: #f5f5f5;
    transform: scale(0.98);
  }
`;

const ArticleNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-center;
  min-width: 16px;
  height: 16px;
  border-radius: 3px;
  background: #e8e8e8;
  color: #666;
  font-size: 10px;
  font-weight: 600;
  margin-right: 6px;
  padding: 0 4px;
`;

const ArticleTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 3px;
  line-height: 1.4;
`;

const ArticleMeta = styled.div`
  font-size: 11px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 15px;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 14px;
`;

interface VirtualEditorialListProps {
  items: EditorialAnalysis[];
  isLoading?: boolean;
}

const VirtualEditorialList: React.FC<VirtualEditorialListProps> = React.memo(({
  items,
  isLoading = false
}) => {
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
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

  const formatShortDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const content = (
    <Container>
      {isLoading && items.length === 0 && (
        <LoadingState>사설 분석을 불러오는 중...</LoadingState>
      )}

      {!isLoading && items.length === 0 && (
        <EmptyState>📰 사설 분석 데이터가 없습니다</EmptyState>
      )}

      {items.map((analysis) => (
        <AnalysisCard key={analysis.id}>
          <CardHeader>
            <QueryText>{analysis.query}</QueryText>
            <DateText>
              {formatDate(analysis.analyzed_at)}
            </DateText>
          </CardHeader>

          {analysis.topics && analysis.topics.length > 0 ? (
            analysis.topics.map((topic) => {
              const isExpanded = expandedTopics[topic.id];
              return (
                <TopicSection key={topic.id}>
                  <TopicHeader onClick={() => toggleTopic(topic.id)}>
                    <TopicNumber>{topic.topic_number}</TopicNumber>
                    <TopicTitle>{topic.topic_title}</TopicTitle>
                    <ExpandIcon expanded={isExpanded}>
                      {isExpanded ? '−' : '+'}
                    </ExpandIcon>
                  </TopicHeader>

                  {isExpanded && (
                    <>
                      <TopicSummary>{topic.topic_summary}</TopicSummary>

                      {topic.articles && topic.articles.length > 0 && (
                        <ArticlesList>
                          {topic.articles.map((article) => (
                            <ArticleItem
                              key={article.id}
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ArticleTitle>
                                <ArticleNumber>{article.article_number}</ArticleNumber>
                                {article.title}
                              </ArticleTitle>
                              <ArticleMeta>
                                <span>{article.media}</span>
                                {article.pubdate && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      {formatShortDate(article.pubdate)}
                                    </span>
                                  </>
                                )}
                              </ArticleMeta>
                            </ArticleItem>
                          ))}
                        </ArticlesList>
                      )}
                    </>
                  )}
                </TopicSection>
              );
            })
          ) : (
            <EmptyState style={{ padding: '20px' }}>
              주제 정보가 없습니다
            </EmptyState>
          )}
        </AnalysisCard>
      ))}
    </Container>
  );

  return content;
});

VirtualEditorialList.displayName = 'VirtualEditorialList';

export default VirtualEditorialList;
