import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';
import { cacheNews } from '@/utils/cacheUtils';
import { saveNews, isNewsAlreadySaved, removeSavedNews, SavedNewsItem } from '@/utils/indexedDBUtils';
import { NewsItem } from '@/types';
import { formatDateToKorean } from '@/utils/dateUtils';
import { trackEvent } from '@/utils/analyticsUtils';

const Card = dynamic(() => import('antd/lib/card'), { ssr: false }) as any;
let message: any = { success: () => {}, error: () => {} };
if (typeof window !== 'undefined') {
  // 클라이언트 사이드에서만 임포트
  import('antd/lib/message').then(mod => {
    message = mod.default;
  });
}
const Tag = dynamic(() => import('antd/lib/tag'), { ssr: false }) as any;

const TouchCard = styled.div<{ isSelected?: boolean; isMounted?: boolean }>`
  background-color: ${props => props.isSelected ? 'rgba(26, 115, 232, 0.1)' : 'white'};
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  padding: 12px;
  margin: 6px 0;
  height: 204px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  transition: background-color 0.2s ease-in-out;
  border-left: ${props => props.isSelected ? '4px solid var(--primary-color)' : '4px solid transparent'};
  
  &:active {
    background-color: ${props => props.isSelected ? 'rgba(26, 115, 232, 0.15)' : 'rgba(0, 0, 0, 0.03)'};
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

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 134px;
  overflow: hidden;
`;

const SelectButton = styled.button<{ isSelected?: boolean }>`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background: ${props => props.isSelected ? 'var(--primary-color)' : 'transparent'};
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isSelected ? 'white' : 'inherit'};
  font-size: 14px;
  font-weight: bold;
  z-index: 2;
  cursor: pointer;
`;

const CardHeader = styled.div`
  margin-bottom: 8px;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
`;

const Date = styled.span`
  font-size: 12px;
  color: #999;
`;

const Title = styled.h3`
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  overflow-wrap: break-word;
  word-break: break-word;
  color: ${(props: { isSelected?: boolean }) => (props.isSelected ? '#1890ff' : 'inherit')};
`;

const Description = styled.p`
  margin: 0;
  font-size: 14px;
  color: #666;
  overflow-wrap: break-word;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

// 아이콘 컴포넌트
const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37069L8.08261 9.26989C7.54305 8.48993 6.6582 8 5.66667 8C4.19391 8 3 9.19391 3 10.6667C3 12.1394 4.19391 13.3333 5.66667 13.3333C6.6582 13.3333 7.54305 12.8434 8.08261 12.0635L15.0227 15.9627C15.0077 16.0842 15 16.2079 15 16.3333C15 17.8061 16.1939 19 17.6667 19C19.1394 19 20.3333 17.8061 20.3333 16.3333C20.3333 14.8606 19.1394 13.6667 17.6667 13.6667C16.6751 13.6667 15.7903 14.1566 15.2507 14.9365L8.31065 11.0373C8.32565 10.9158 8.33333 10.7921 8.33333 10.6667C8.33333 10.5412 8.32565 10.4175 8.31065 10.2961L15.2507 6.3968C15.7903 7.17676 16.6751 7.66667 17.6667 7.66667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SavedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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
  const [isMounted, setIsMounted] = useState(false);
  
  // 마운트 상태 관리
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // 공유 및 저장 상태 관리
  const isSaved = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return isNewsAlreadySaved(id);
  }, [id]);

  const handleClickShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title,
        text: description,
        url: original_link
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(original_link);
      alert('링크가 클립보드에 복사되었습니다.');
    }
    trackEvent('share_news', { id, title });
  };

  const handleClickSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      removeSavedNews(id);
    } else {
      saveNews({ 
        id, 
        title, 
        description, 
        date, 
        category, 
        original_link 
      });
    }
    trackEvent(isSaved ? 'unsave_news' : 'save_news', { id, title });
  };

  const handleClick = () => {
    onClick?.();
    trackEvent('click_news', { id, title });
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(id, !isSelected);
      trackEvent('select_news', { id, title });
    }
  };

  return (
    <TouchCard
      onClick={handleClick}
      isSelected={isSelected}
      isMounted={isMounted}
      className={isSelected ? 'selected-news-card' : ''}
    >
      <SelectButton onClick={handleSelectClick} isSelected={isSelected}>
        {isSelected ? '✓' : '+'}
      </SelectButton>
      
      <CardHeader>
        <Title>{title}</Title>
      </CardHeader>
      
      <CardContent>
        <Description>{description}</Description>
      </CardContent>
      
      <CardFooter>
        <Date>{date}</Date>
        <ActionButtons>
          <IconButton onClick={handleClickShare} aria-label="공유">
            <ShareIcon />
          </IconButton>
          <IconButton onClick={handleClickSave} aria-label={isSaved ? '저장 취소' : '저장'}>
            {isSaved ? <SavedIcon /> : <SaveIcon />}
          </IconButton>
        </ActionButtons>
      </CardFooter>
    </TouchCard>
  );
};

export default NewsCard;