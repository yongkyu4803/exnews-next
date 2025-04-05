import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { trackEvent } from '@/utils/analyticsUtils';

// 동적으로 임포트하는 컴포넌트들
const Card = dynamic(() => import('antd/lib/card'), { ssr: false }) as any;
let message: any = { success: () => {}, error: () => {} };
if (typeof window !== 'undefined') {
  import('antd/lib/message').then(mod => {
    message = mod.default;
  });
}
const Tag = dynamic(() => import('antd/lib/tag'), { ssr: false }) as any;

// 스타일 컴포넌트
const TouchCard = styled.div<{ isSelected?: boolean; isMounted?: boolean }>`
  background-color: ${props => props.isSelected ? 'rgba(26, 115, 232, 0.1)' : 'white'};
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  padding: 8px;
  margin: 2px 0;
  height: 80px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  transition: background-color 0.2s ease-in-out;
  border-left: ${props => props.isSelected ? '4px solid var(--primary-color)' : '1px solid #eee'};
  
  &:active {
    background-color: ${props => props.isSelected ? 'rgba(26, 115, 232, 0.15)' : 'rgba(0, 0, 0, 0.03)'};
  }
`;

const CardHeader = styled.div`
  margin-bottom: 28px;
`;

const CardFooter = styled.div<{ isSelected?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2px;
  padding-top: 2px;
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  background: ${props => props.isSelected ? 'rgba(26, 115, 232, 0.1)' : 'white'};
`;

const Title = styled.h3`
  margin: 0;
  font-size: 13px;
  line-height: 1.3;
  font-weight: 600;
  overflow-wrap: break-word;
  word-break: break-word;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 34px;
`;

const MediaName = styled.span`
  font-size: 10px;
  color: #666;
  background-color: #f5f5f5;
  padding: 1px 4px;
  border-radius: 4px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 2px;
  font-size: 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  
  &:hover, &:active {
    background-color: rgba(0,0,0,0.05);
  }
`;

const SelectButton = styled.button<{ isSelected?: boolean }>`
  width: 24px;
  height: 24px;
  background: ${props => props.isSelected ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)'};
  border: ${props => props.isSelected ? 'none' : '1px solid rgba(0,0,0,0.1)'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isSelected ? 'white' : '#666'};
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  
  &:active {
    transform: scale(0.95);
  }
`;

// 아이콘 컴포넌트
const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37069L8.08261 9.26989C7.54305 8.48993 6.6582 8 5.66667 8C4.19391 8 3 9.19391 3 10.6667C3 12.1394 4.19391 13.3333 5.66667 13.3333C6.6582 13.3333 7.54305 12.8434 8.08261 12.0635L15.0227 15.9627C15.0077 16.0842 15 16.2079 15 16.3333C15 17.8061 16.1939 19 17.6667 19C19.1394 19 20.3333 17.8061 20.3333 16.3333C20.3333 14.8606 19.1394 13.6667 17.6667 13.6667C16.6751 13.6667 15.7903 14.1566 15.2507 14.9365L8.31065 11.0373C8.32565 10.9158 8.33333 10.7921 8.33333 10.6667C8.33333 10.5412 8.32565 10.4175 8.31065 10.2961L15.2507 6.3968C15.7903 7.17676 16.6751 7.66667 17.6667 7.66667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface RankingNewsCardProps {
  title: string;
  link: string;
  media_name: string;
  id: string;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onClick?: () => void;
}

const RankingNewsCard: React.FC<RankingNewsCardProps> = ({
  title,
  link,
  media_name,
  id,
  isSelected = false,
  onSelect,
  onClick
}) => {
  const [isMounted, setIsMounted] = useState(false);
  
  // 마운트 상태 관리
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleClickShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        navigator.share({
          title: title || '뉴스 공유',
          text: media_name || '뉴스 매체',
          url: link || window.location.href
        }).catch(err => {
          console.error('공유 실패:', err);
          // 공유 실패 시 클립보드 복사 대체
          navigator.clipboard.writeText(link || window.location.href);
          alert('링크가 클립보드에 복사되었습니다.');
        });
      } else {
        navigator.clipboard.writeText(link || window.location.href);
        alert('링크가 클립보드에 복사되었습니다.');
      }
      
      if (id) {
        trackEvent('share_ranking_news', { id, title: title || '제목 없음' });
      }
    } catch (error) {
      console.error('공유 중 오류 발생:', error);
      alert('공유 중 오류가 발생했습니다.');
    }
  };

  const handleClick = () => {
    // onClick이 함수인 경우에만 실행
    if (typeof onClick === 'function') {
      onClick();
    }
    
    // 링크가 있는 경우에만 실행
    if (link && link !== '#') {
      // 새 창에서 열기 (보안 속성 추가)
      window.open(link, '_blank', 'noopener,noreferrer');
    }
    
    // 이벤트 트래킹
    if (id) {
      trackEvent('click_ranking_news', { id, title: title || '제목 없음' });
    }
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // onSelect가 함수인 경우에만 실행
    if (typeof onSelect === 'function') {
      onSelect(id, !isSelected);
      if (id) {
        trackEvent('select_ranking_news', { id, title: title || '제목 없음' });
      }
    }
  };

  // 내용이 비어있는 경우 대체 데이터 사용
  const safeTitle = title || '제목 없음';
  const safeMediaName = media_name || '매체 정보 없음';
  
  return (
    <TouchCard
      onClick={handleClick}
      isSelected={isSelected}
      isMounted={isMounted}
      className={isSelected ? 'selected-ranking-news-card' : ''}
    >
      <CardHeader>
        <Title>{safeTitle}</Title>
      </CardHeader>
      
      <CardFooter isSelected={isSelected}>
        <MediaName>{safeMediaName}</MediaName>
        <ActionButtons>
          <IconButton onClick={handleClickShare} aria-label="공유" style={{ opacity: 1, visibility: 'visible' }}>
            <ShareIcon />
          </IconButton>
          <SelectButton onClick={handleSelectClick} isSelected={isSelected}>
            {isSelected ? '✓' : '+'}
          </SelectButton>
        </ActionButtons>
      </CardFooter>
    </TouchCard>
  );
};

export default RankingNewsCard; 