import React, { useState } from 'react';
import styled from '@emotion/styled';
import { EditorialAnalysis } from '@/types';

const Container = styled.div`
  width: 100%;
  padding: 8px;
`;

const AnalysisCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const CardHeader = styled.div`
  margin-bottom: 12px;
`;

const QueryText = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #1a1a1a;
  margin: 0 0 8px 0;
`;

const DateText = styled.div`
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
`;

const TopicSection = styled.div`
  margin-top: 12px;
`;

const TopicHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  user-select: none;
`;

const TopicNumber = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1a73e8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
`;

const TopicTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  flex: 1;
`;

const ExpandIcon = styled.span<{ expanded: boolean }>`
  font-size: 20px;
  color: #1a73e8;
  font-weight: bold;
  transition: transform 0.2s ease;
  line-height: 1;
`;

const TopicSummary = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #4a4a4a;
  margin: 8px 0 12px 44px;
  white-space: pre-wrap;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
`;

const ArticlesList = styled.div`
  margin-left: 44px;
`;

const ArticleItem = styled.a`
  display: block;
  padding: 12px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
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
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e8e8e8;
  color: #666;
  font-size: 11px;
  font-weight: bold;
  margin-right: 8px;
`;

const ArticleTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 4px;
  line-height: 1.4;
`;

const ArticleMeta = styled.div`
  font-size: 12px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 8px;
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
