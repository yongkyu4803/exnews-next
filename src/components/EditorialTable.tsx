import React from 'react';
import dynamic from 'next/dynamic';
import { EditorialAnalysis } from '@/types';
import styled from '@emotion/styled';

const Table = dynamic(() => import('antd/lib/table'), { ssr: false }) as any;

const TopicContainer = styled.div`
  margin-left: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
`;

const TopicHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const TopicNumber = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #1a73e8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
`;

const TopicTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;

const TopicSummary = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #4a4a4a;
  margin-bottom: 16px;
  white-space: pre-wrap;
`;

const ArticleLink = styled.a`
  display: flex;
  align-items: flex-start;
  padding: 10px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f0f0;
    border-color: #1a73e8;
  }
`;

const ArticleNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e8e8e8;
  color: #666;
  font-size: 12px;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
`;

const ArticleContent = styled.div`
  flex: 1;
`;

const ArticleTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 4px;
`;

const ArticleMeta = styled.div`
  font-size: 12px;
  color: #888;
`;

interface EditorialTableProps {
  items: EditorialAnalysis[];
}

const EditorialTable: React.FC<EditorialTableProps> = React.memo(({ items }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
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

  const columns = [
    {
      title: '검색어',
      dataIndex: 'query',
      key: 'query',
      render: (text: string) => (
        <div style={{ fontWeight: 600, fontSize: '15px' }}>{text}</div>
      )
    },
    {
      title: '분석 시각',
      dataIndex: 'analyzed_at',
      key: 'analyzed_at',
      width: 200,
      render: (text: string) => (
        <div style={{ fontSize: '13px', color: '#666' }}>
          {formatDate(text)}
        </div>
      )
    }
  ];

  const expandedRowRender = (record: EditorialAnalysis) => {
    if (!record.topics || record.topics.length === 0) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          주제 정보가 없습니다
        </div>
      );
    }

    return (
      <div style={{ padding: '12px 24px' }}>
        {record.topics.map((topic) => (
          <TopicContainer key={topic.id}>
            <TopicHeader>
              <TopicNumber>{topic.topic_number}</TopicNumber>
              <TopicTitle>{topic.topic_title}</TopicTitle>
            </TopicHeader>

            <TopicSummary>{topic.topic_summary}</TopicSummary>

            {topic.articles && topic.articles.length > 0 && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#666' }}>
                  관련 기사 ({topic.articles.length}개)
                </div>
                {topic.articles.map((article) => (
                  <ArticleLink
                    key={article.id}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArticleNumber>{article.article_number}</ArticleNumber>
                    <ArticleContent>
                      <ArticleTitle>{article.title}</ArticleTitle>
                      <ArticleMeta>
                        {article.media}
                        {article.pubdate && (
                          <>
                            {' • '}
                            {formatShortDate(article.pubdate)}
                          </>
                        )}
                      </ArticleMeta>
                    </ArticleContent>
                  </ArticleLink>
                ))}
              </div>
            )}
          </TopicContainer>
        ))}
      </div>
    );
  };

  return (
    <Table
      columns={columns}
      dataSource={items}
      rowKey="id"
      expandable={{
        expandedRowRender,
        expandRowByClick: true
      }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total: number) => `총 ${total}개 분석 결과`
      }}
      locale={{
        emptyText: '📰 사설 분석 데이터가 없습니다'
      }}
      size="small"
    />
  );
});

EditorialTable.displayName = 'EditorialTable';

export default EditorialTable;
