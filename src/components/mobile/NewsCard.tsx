import React, { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';
import { cacheNews } from '@/utils/cacheUtils';
import { saveRecentNews } from '@/utils/indexedDBUtils';
import { NewsItem } from '@/types';
import { formatDateToKorean } from '@/utils/dateUtils';
import { trackEvent } from '@/utils/analytics';

const Card = dynamic(() => import('antd/lib/card'), { ssr: false }) as any;
let message: any = { success: () => {}, error: () => {} };
if (typeof window !== 'undefined') {
  // 클라이언트 사이드에서만 임포트
  import('antd/lib/message').then(mod => {
    message = mod.default;
  });
}
const Tag = dynamic(() => import('antd/lib/tag'), { ssr: false }) as any;

const TouchCard = styled.div<{ isSelected?: boolean }>`
  position: relative;
  width: 100%;
  margin: 0 0 8px 0;
  padding: 12px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  cursor: pointer;
  border-left: ${(props) => (props.isSelected ? '4px solid #1890ff' : '4px solid transparent')};
  background-color: ${(props) => (props.isSelected ? '#e6f7ff' : '#fff')};
  transition: all 0.2s ease;
  transform: ${(props) => (props.isSelected ? 'scale(1.01)' : 'scale(1)')};
  box-shadow: ${(props) => (props.isSelected ? '0 4px 8px rgba(24, 144, 255, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)')};
  
  &::after {
    content: ${(props) => (props.isSelected ? '""' : 'none')};
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 16px 16px 0;
    border-color: transparent #1890ff transparent transparent;
  }
`;

const CardTitle = styled.h3`
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  overflow-wrap: break-word;
  word-break: break-word;
  color: ${(props: { isSelected?: boolean }) => (props.isSelected ? '#1890ff' : 'inherit')};
`;

const CardDescription = styled.p`
  margin: 0 0 6px 0;
  font-size: 14px;
  color: #666;
  overflow-wrap: break-word;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  width: 100%;
`;

const CardDate = styled.span`
  font-size: 12px;
  color: #999;
`;

const CardCategory = styled.span`
  font-size: 12px;
  background-color: #f0f0f0;
  color: #666;
  padding: 2px 6px;
  border-radius: 4px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 13px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

interface NewsCardProps {
  title: string;
  description: string;
  date: string;
  category: string;
  original_link: string;
  id: string;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onClick?: () => void;
}

const NewsCard: React.FC<NewsCardProps> = ({
  title,
  description,
  date,
  category,
  original_link,
  id,
  isSelected = false,
  onSelect,
  onClick
}) => {
  const router = useRouter();
  // const [isSaved, setIsSaved] = useState(() => isNewsAlreadySaved(id));
  
  // 롱프레스 처리를 위한 상태와 타이머 참조
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [pressing, setPressing] = useState(false);
  
  // 롱프레스 시작 처리
  const handlePressStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setPressing(true);
    
    longPressTimer.current = setTimeout(() => {
      if (onSelect) {
        onSelect(id, !isSelected);
        // 진동 효과 추가 (지원하는 브라우저에서만)
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
      setPressing(false);
    }, 500); // 0.5초 동안 누르면 롱프레스로 인식
  }, [id, isSelected, onSelect]);
  
  // 롱프레스 종료 처리
  const handlePressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setPressing(false);
  }, []);
  
  // 롱프레스 취소 (스크롤 시작 등)
  const handlePressCancel = useCallback(() => {
    handlePressEnd();
  }, [handlePressEnd]);
  
  // 저장 기능 주석 처리
  /*
  const handleSaveForLater = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newsItem = {
      id: parseInt(id, 10) || Date.now(),
      title,
      description,
      pub_date: date,
      category,
      original_link,
    };
    
    try {
      saveForLater(newsItem);
      setIsSaved(true);
      const msg = message.success('뉴스가 저장되었습니다.');
      trackEvent('save_news', {
        news_id: id,
        title,
        category,
      });
    } catch (error) {
      const msg = message.error('저장 중 오류가 발생했습니다');
      console.error('Failed to save news', error);
    }
  }, [id, title, description, date, category, original_link]);
  */
  
  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(original_link);
      const msg = message.success('링크가 복사되었습니다');
      trackEvent('share_news', {
        news_id: id,
        title,
        category,
      });
    } catch (error) {
      const msg = message.error('링크 복사 중 오류가 발생했습니다');
      console.error('Failed to copy link', error);
    }
  }, [id, original_link, title, category]);
  
  const handleClick = useCallback(() => {
    // 롱프레스 중이면 클릭 무시
    if (pressing) return;
    
    if (onClick) {
      onClick();
    } else {
      window.open(original_link, '_blank', 'noopener,noreferrer');
    }
    
    trackEvent('click_news', {
      news_id: id,
      title,
      category,
    });
  }, [id, original_link, onClick, title, category, pressing]);

  return (
    <TouchCard 
      onClick={handleClick} 
      isSelected={isSelected}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressCancel}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressCancel}
    >
      <CardTitle isSelected={isSelected}>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
      <CardMeta>
        <CardDate>{date}</CardDate>
        <CardCategory>{category}</CardCategory>
      </CardMeta>
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          width: '20px',
          height: '20px',
          background: '#1890ff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          ✓
        </div>
      )}
      <ActionButtons>
        <ActionButton onClick={handleShare}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37069L8.08261 9.26989C7.54305 8.48993 6.6582 8 5.66667 8C4.19391 8 3 9.19391 3 10.6667C3 12.1394 4.19391 13.3333 5.66667 13.3333C6.6582 13.3333 7.54305 12.8434 8.08261 12.0635L15.0227 15.9627C15.0077 16.0842 15 16.2079 15 16.3333C15 17.8061 16.1939 19 17.6667 19C19.1394 19 20.3333 17.8061 20.3333 16.3333C20.3333 14.8606 19.1394 13.6667 17.6667 13.6667C16.6751 13.6667 15.7903 14.1566 15.2507 14.9365L8.31065 11.0373C8.32565 10.9158 8.33333 10.7921 8.33333 10.6667C8.33333 10.5412 8.32565 10.4175 8.31065 10.2961L15.2507 6.3968C15.7903 7.17676 16.6751 7.66667 17.6667 7.66667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          공유
        </ActionButton>
        {/* 저장 기능 주석 처리
        <ActionButton onClick={handleSaveForLater} disabled={isSaved}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {isSaved ? '저장됨' : '저장'}
        </ActionButton>
        */}
      </ActionButtons>
    </TouchCard>
  );
};

export default NewsCard;