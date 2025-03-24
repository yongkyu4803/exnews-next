import React, { useState, memo } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { useSwipeable } from 'react-swipeable';
import { cacheNews } from '@/utils/cacheUtils';
import { saveRecentNews } from '@/utils/indexedDBUtils';
import { NewsItem } from '@/types';
import { formatDateToKorean } from '@/utils/dateUtils';

const Card = dynamic(() => import('antd/lib/card'), { ssr: false }) as any;
let message: any = { success: () => {}, error: () => {} };
if (typeof window !== 'undefined') {
  // 클라이언트 사이드에서만 임포트
  import('antd/lib/message').then(mod => {
    message = mod.default;
  });
}
const Tag = dynamic(() => import('antd/lib/tag'), { ssr: false }) as any;

const TouchCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: var(--card-border-radius, 16px);
  background: #ffffff;
  box-shadow: var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.1));
  transition: all 0.2s ease;
  overflow: hidden;
  
  &:active {
    transform: scale(0.98);
    background: #f8f8f8;
  }

  .ant-card-body {
    padding: 18px;
  }

  .news-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
    color: #1a1a1a;
    line-height: 1.4;
  }

  .news-description {
    font-size: 16px;
    color: #444;
    margin-bottom: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
  }

  .news-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #666;

    .category {
      background: #f0f0f0;
      padding: 6px 12px;
      border-radius: 16px;
      color: #555;
      font-weight: 500;
    }
    
    .date {
      margin-left: 8px;
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
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
`;

const ActionButton = styled.button<{ buttonType: 'share' | 'save' }>`
  position: absolute;
  top: 0;
  ${({ buttonType }) => buttonType === 'share' ? 'right: -65px' : 'right: -130px'};
  height: 100%;
  width: 65px;
  border: none;
  color: white;
  background: ${({ buttonType }) => buttonType === 'share' ? 'var(--primary-color, #1a4b8c)' : '#40a9ff'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  
  &:active {
    opacity: 0.85;
  }
  
  /* 아이콘 */
  &::before {
    content: ${({ buttonType }) => buttonType === 'share' ? '"↗"' : '"✓"'};
    font-size: 20px;
    margin-bottom: 4px;
  }
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
  const [isSwiping, setIsSwiping] = useState(false);

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
    // 스와이프 중에는 클릭 방지
    if (isSwiping) return;
    handleCache();
    onClick();
  };

  const handlers = useSwipeable({
    onSwiping: (e: { deltaX: number }) => {
      setIsSwiping(true);
      if (e.deltaX < 0) { // 왼쪽으로 스와이프
        setOffset(Math.max(-130, e.deltaX));
      } else if (e.deltaX > 0 && offset < 0) { // 오른쪽으로 스와이프 (닫기)
        setOffset(Math.min(0, offset + Math.abs(e.deltaX) * 0.5));
      }
    },
    onSwipedLeft: () => {
      setOffset(-130); // 완전히 열기
      setTimeout(() => setIsSwiping(false), 300);
    },
    onSwipedRight: () => {
      setOffset(0); // 닫기
      setTimeout(() => setIsSwiping(false), 300);
    },
    trackMouse: false, // 모바일에서는 마우스 이벤트 불필요
    trackTouch: true,
    delta: 10, // 조금 더 민감하게 스와이프 인식
  });

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: original_link || (typeof window !== 'undefined' ? window.location.href : '')
      }).catch(err => {
        console.log('공유하기를 취소했거나 오류가 발생했습니다.', err);
      });
    } else {
      // 공유 API가 지원되지 않는 경우 링크 복사
      if (typeof navigator !== 'undefined') {
        navigator.clipboard.writeText(original_link || window.location.href);
        // @ts-ignore
        message.success('링크가 복사되었습니다.');
      }
    }
    
    // 스와이프 상태 초기화
    setTimeout(() => setOffset(0), 300);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await handleCache();
      if (typeof window !== 'undefined') {
        // @ts-ignore
        message.success('뉴스가 저장되었습니다.');
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        message.error('뉴스 저장에 실패했습니다.');
      }
    }
    
    // 스와이프 상태 초기화 
    setTimeout(() => setOffset(0), 300);
  };

  // 접근성 속성 추가
  const cardProps = {
    'aria-label': `뉴스: ${title}`,
    role: 'article',
    tabIndex: 0,
    onKeyPress: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleClick();
      }
    }
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const textToCopy = `${title}\n\n${description}\n\n원본 링크: ${original_link}`;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        // @ts-ignore - message는 동적으로 로드되어 타입 에러가 발생할 수 있음
        message.success('클립보드에 복사되었습니다');
      })
      .catch(() => {
        // @ts-ignore
        message.error('복사에 실패했습니다');
      });
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
    
    // IndexedDB에 최근 본 뉴스로 저장
    const newsItem = {
      id,
      title,
      description,
      pub_date: new Date(date).toISOString(),
      category,
      original_link
    };
    
    // 두 저장소에 모두 저장 (IndexedDB와 localStorage)
    saveRecentNews(newsItem).catch(err => console.error('뉴스 저장 실패:', err));
    cacheNews(newsItem).catch(err => console.error('캐시 저장 실패:', err));
    
    // 조회 이벤트 기록 (분석용)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore
      window.gtag('event', 'view_item', {
        items: [{ id, category }]
      });
    }
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', touchAction: 'pan-y' }}>
      <CardWrapper offset={offset} {...handlers}>
        <TouchCard 
          onClick={handleCardClick}
          hoverable
          {...cardProps}
        >
          <h3 className="news-title">{title}</h3>
          <p className="news-description">{description}</p>
          <div className="news-meta">
            <span className="category">{category}</span>
            <span className="date">{date}</span>
          </div>
        </TouchCard>
      </CardWrapper>
      <ActionButton 
        buttonType="share" 
        onClick={handleShare}
        aria-label="뉴스 공유하기"
      >
        공유
      </ActionButton>
      <ActionButton 
        buttonType="save" 
        onClick={handleSave}
        aria-label="뉴스 저장하기"
      >
        저장
      </ActionButton>
    </div>
  );
}