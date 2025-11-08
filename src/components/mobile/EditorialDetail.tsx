/**
 * 사설 분석 상세 컴포넌트
 */

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { EditorialAnalysis } from '@/types';

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

const AnalysisDate = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const AnalysisTitle = styled.h1`
  font-family: 'Cafe24Anemone', sans-serif;
  font-size: 28px;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const ModelInfo = styled.div`
  font-size: 13px;
  color: #9ca3af;
  margin-top: 8px;
`;

const TopicsContainer = styled.div`
  margin-top: 32px;
`;

const TopicCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const TopicHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
`;

const TopicNumber = styled.div`
  min-width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #e8f0fe;
  color: #1a73e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
`;

const TopicTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const TopicSummary = styled.p`
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
  margin: 0 0 24px 0;
  white-space: pre-wrap;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #1a73e8;

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 14px;
  }
`;

const ArticlesSection = styled.div`
  margin-top: 20px;
`;

const ArticlesSectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #3b82f6;
`;

const ArticlesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ArticleItem = styled.a`
  display: block;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 768px) {
    padding: 14px;
  }
`;

const ArticleHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
`;

const ArticleNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #e8e8e8;
  color: #666;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
`;

const ArticleTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.5;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ArticleMeta = styled.div`
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 34px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  font-size: 16px;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 20px;
  text-align: center;

  h3 {
    font-size: 20px;
    color: #ef4444;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #666;
  }
`;

interface EditorialDetailProps {
  editorialId: string;
  onBack: () => void;
  editorial?: EditorialAnalysis;
}

const EditorialDetail: React.FC<EditorialDetailProps> = ({ editorialId, onBack, editorial }) => {
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

  if (!editorial) {
    return (
      <Container>
        <ErrorContainer>
          <h3>⚠️ 오류 발생</h3>
          <p>사설 분석을 찾을 수 없습니다.</p>
          <BackButton onClick={onBack}>← 목록으로 돌아가기</BackButton>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={onBack}>← 목록으로 돌아가기</BackButton>

      <Header>
        <AnalysisDate>{formatDate(editorial.analyzed_at)}</AnalysisDate>
        <AnalysisTitle>{editorial.query}</AnalysisTitle>
        <ModelInfo>분석 모델: {editorial.llm_model}</ModelInfo>
      </Header>

      <TopicsContainer>
        {editorial.topics && editorial.topics.length > 0 ? (
          editorial.topics.map((topic) => (
            <TopicCard key={topic.id}>
              <TopicHeader>
                <TopicNumber>{topic.topic_number}</TopicNumber>
                <TopicTitle>{topic.topic_title}</TopicTitle>
              </TopicHeader>

              <TopicSummary>{topic.topic_summary}</TopicSummary>

              {topic.articles && topic.articles.length > 0 && (
                <ArticlesSection>
                  {/* <ArticlesSectionTitle>
                    관련 사설 ({topic.articles.length}개)
                  </ArticlesSectionTitle> */}
                  <ArticlesList>
                    {topic.articles.map((article) => (
                      <ArticleItem
                        key={article.id}
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ArticleHeader>
                          <ArticleNumber>{article.article_number}</ArticleNumber>
                          <ArticleTitle>{article.title}</ArticleTitle>
                        </ArticleHeader>
                        <ArticleMeta>
                          <span>{article.media}</span>
                          {article.pubdate && (
                            <>
                              <span>•</span>
                              <span>{formatShortDate(article.pubdate)}</span>
                            </>
                          )}
                        </ArticleMeta>
                      </ArticleItem>
                    ))}
                  </ArticlesList>
                </ArticlesSection>
              )}
            </TopicCard>
          ))
        ) : (
          <ErrorContainer>
            <p>주제 정보가 없습니다.</p>
          </ErrorContainer>
        )}
      </TopicsContainer>
    </Container>
  );
};

export default EditorialDetail;
