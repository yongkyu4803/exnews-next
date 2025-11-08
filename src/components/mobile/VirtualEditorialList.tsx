import React, { useState } from 'react';
import styled from '@emotion/styled';
import { EditorialAnalysis } from '@/types';
import EditorialDetail from './EditorialDetail';

const Container = styled.div`
  width: 100%;
  padding: 4px;
`;

const ActionBar = styled.div`
  position: sticky;
  top: 0;
  background: white;
  padding: 16px;
  margin: -4px -4px 20px -4px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const SelectInfo = styled.div`
  font-size: 14px;
  color: #6b7280;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: #f9fafb;
    border-color: #3b82f6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 13px;
  }
`;

const PrimaryButton = styled(ActionButton)`
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;

  &:hover {
    background: #2563eb;
    border-color: #2563eb;
  }
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AnalysisCard = styled.div<{ selected?: boolean }>`
  background: white;
  border: 1px solid ${props => props.selected ? '#3b82f6' : '#e5e7eb'};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  display: flex;
  align-items: flex-start;
  gap: 12px;

  ${props => props.selected && `
    background: #eff6ff;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin-right: 12px;
  flex-shrink: 0;
`;

const CardContent = styled.div`
  flex: 1;
  cursor: pointer;
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
  selectedEditorialId?: string | null;
  onEditorialClick?: (id: string) => void;
  onBack?: () => void;
}

const VirtualEditorialList: React.FC<VirtualEditorialListProps> = React.memo(({
  items,
  isLoading = false,
  selectedEditorialId: externalSelectedId,
  onEditorialClick,
  onBack: externalOnBack
}) => {
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  // 외부에서 제어하거나 내부 상태 사용
  const selectedEditorialId = externalSelectedId !== undefined ? externalSelectedId : internalSelectedId;
  const setSelectedEditorialId = onEditorialClick || setInternalSelectedId;
  const handleBack = externalOnBack || (() => setInternalSelectedId(null));

  const toggleTopic = (topicId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  // 체크박스 토글
  const toggleItemSelection = (itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  // 클립보드 복사
  const handleCopyToClipboard = async () => {
    if (selectedItems.size === 0) {
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((msg) => {
          msg.default.info('선택된 사설 분석이 없습니다.');
        });
      }
      return;
    }

    const selectedData = items.filter(item => selectedItems.has(item.id));

    const textToCopy = `[가장빠른 사설분석 정보]\n\n` +
      selectedData.map(analysis => {
        const pageUrl = `${window.location.origin}/?tab=editorial&id=${analysis.id}`;
        const topicsText = analysis.topics && analysis.topics.length > 0
          ? analysis.topics.map(topic => `${topic.topic_number}. ${topic.topic_title}\n${topic.topic_summary}`).join('\n\n')
          : '주제 정보 없음';

        return `${analysis.query}\n\n분석일시: ${formatDate(analysis.analyzed_at)}\n\n주요 주제:\n${topicsText}\n\n상세보기: ${pageUrl}\n`;
      }).join('\n---\n\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((msg) => {
          msg.default.success(`${selectedItems.size}개 사설 분석이 복사되었습니다.`);
        });
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((msg) => {
          msg.default.error('복사에 실패했습니다.');
        });
      }
    }
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

  const handleCardClick = (id: string) => {
    setSelectedEditorialId(id);
  };

  // 선택된 사설 분석이 있으면 상세 화면 표시
  if (selectedEditorialId) {
    const selectedEditorial = items.find(item => item.id === selectedEditorialId);
    return (
      <EditorialDetail
        editorialId={selectedEditorialId}
        editorial={selectedEditorial}
        onBack={handleBack}
      />
    );
  }

  const content = (
    <Container>
      {isLoading && items.length === 0 && (
        <LoadingState>사설 분석을 불러오는 중...</LoadingState>
      )}

      {!isLoading && items.length === 0 && (
        <EmptyState>📰 사설 분석 데이터가 없습니다</EmptyState>
      )}

      {items.length > 0 && (
        <>
          <ActionBar>
            <SelectInfo>
              {selectedItems.size > 0 ? `${selectedItems.size}개 선택됨` : '사설 분석을 선택하세요'}
            </SelectInfo>
            <ActionButtons>
              <ActionButton onClick={toggleSelectAll}>
                {selectedItems.size === items.length ? '전체 해제' : '전체 선택'}
              </ActionButton>
              <PrimaryButton onClick={handleCopyToClipboard} disabled={selectedItems.size === 0}>
                📋 복사
              </PrimaryButton>
            </ActionButtons>
          </ActionBar>

          <ListContainer>
            {items.map((analysis) => (
              <AnalysisCard
                key={analysis.id}
                selected={selectedItems.has(analysis.id)}
                onClick={() => handleCardClick(analysis.id)}
              >
                <Checkbox
                  type="checkbox"
                  checked={selectedItems.has(analysis.id)}
                  onChange={(e) => toggleItemSelection(analysis.id, e as any)}
                  onClick={(e) => e.stopPropagation()}
                />
                <CardContent>
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
                          <TopicHeader onClick={(e) => toggleTopic(topic.id, e)}>
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
                                      onClick={(e) => e.stopPropagation()}
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
                </CardContent>
              </AnalysisCard>
            ))}
          </ListContainer>
        </>
      )}
    </Container>
  );

  return content;
});

VirtualEditorialList.displayName = 'VirtualEditorialList';

export default VirtualEditorialList;
