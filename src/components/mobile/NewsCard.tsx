import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { useSwipeable } from 'react-swipeable';
import { cacheNews } from '@/utils/cacheUtils';

const Card = dynamic(() => import('antd').then((antd) => antd.Card), { ssr: false });
const message = dynamic(() => import('antd').then((antd) => antd.message), { ssr: false });

const TouchCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.98);
    background: #f8f8f8;
  }

  .ant-card-body {
    padding: 16px;
  }

  .news-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #1a1a1a;
  }

  .news-description {
    font-size: 14px;
    color: #666;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .news-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #888;

    .category {
      background: #f0f0f0;
      padding: 4px 8px;
      border-radius: 12px;
      color: #666;
    }
  }
`;

interface NewsCardProps {
  title: string;
  description: string;
  date: string;
  category: string;
  original_link?: string;
  id?: string;
  onClick: () => void;
}

const CardWrapper = styled.div<{ offset: number }>`
  transform: translateX(${props => props.offset}px);
  transition: transform 0.3s ease;
`;

const ActionButton = styled.button<{ buttonType: 'share' | 'save' }>`
  position: absolute;
  top: 0;
  ${({ buttonType }) => buttonType === 'share' ? 'right: -60px' : 'right: -120px'};
  height: 100%;
  width: 60px;
  border: none;
  color: white;
  background: ${({ buttonType }) => buttonType === 'share' ? '#1a4b8c' : '#40a9ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
`;

export default function NewsCard({ 
  title, 
  description, 
  date, 
  category, 
  original_link = '', 
  id = `news-${Date.now()}`,
  onClick 
}: NewsCardProps) {
  const [offset, setOffset] = useState(0);

  // 뉴스 아이템 캐싱 처리 함수
  const handleCache = async () => {
    const newsItem = {
      id,
      title,
      description,
      pub_date: date,
      category,
      original_link
    };
    
    await cacheNews(newsItem);
  };

  // 기존 onClick 함수 래핑하여 캐싱 기능 추가
  const handleClick = () => {
    handleCache();
    onClick();
  };

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (e.deltaX < 0) { // 왼쪽으로 스와이프
        setOffset(Math.max(-120, e.deltaX));
      }
    },
    onSwipedLeft: () => {
      setOffset(-120); // 완전히 열기
    },
    onSwipedRight: () => {
      setOffset(0); // 닫기
    },
    trackMouse: true
  });

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: original_link || (typeof window !== 'undefined' ? window.location.href : '')
      });
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await handleCache();
      if (typeof window !== 'undefined') {
        message.success('뉴스가 저장되었습니다.');
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        message.error('뉴스 저장에 실패했습니다.');
      }
    }
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <CardWrapper offset={offset} {...handlers}>
        <TouchCard onClick={handleClick}>
          <h3 className="news-title">{title}</h3>
          <p className="news-description">{description}</p>
          <div className="news-meta">
            <span className="category">{category}</span>
            <span className="date">{date}</span>
          </div>
        </TouchCard>
      </CardWrapper>
      <ActionButton buttonType="share" onClick={handleShare}>공유</ActionButton>
      <ActionButton buttonType="save" onClick={handleSave}>저장</ActionButton>
    </div>
  );
}