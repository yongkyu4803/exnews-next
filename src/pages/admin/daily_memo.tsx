/**
 * Daily Memo Page
 * 최신 정치/법안/사설 리포트를 카톡 메모 스타일로 보여주는 페이지
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import styled from '@emotion/styled';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { isAuthenticated, getAuthTimeRemaining, clearAuth } from '@/utils/adminAuth';
import { createLogger } from '@/utils/logger';
import AdminNav from '@/components/Admin/AdminNav';

const logger = createLogger('Pages:Admin:DailyMemo');

// Dynamic imports for Ant Design
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;
const Spin = dynamic(() => import('antd/lib/spin'), { ssr: false }) as any;

const Container = styled.div`
  min-height: 50vh;
  background: #f5f5f5;
  padding: 8px;

  @media (max-width: 768px) {
    padding: 8px;
  }
`;

const Header = styled.div`
  max-width: 800px;
  margin: 0 auto 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const Title = styled.h1`
  font-family: 'Cafe24Anemone', sans-serif;
  font-size: 28px;
  margin: 0;
  color: #1a1a1a;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const MemoCard = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 12px;
    border-radius: 8px;
  }
`;

const MemoContent = styled.div`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  word-break: keep-all;

  h2 {
    font-size: 18px;
    font-weight: 700;
    margin: 10px 0 6px 0;
    color: #1a1a1a;

    &:first-of-type {
      margin-top: 0;
    }
  }

  h3 {
    font-size: 15px;
    font-weight: 600;
    margin: 6px 0 3px 0;
    color: #333;
  }

  h4 {
    font-size: 14px;
    font-weight: 600;
    margin: 4px 0 3px 0;
    color: #555;
  }

  p {
    margin: 4px 0;
  }

  ul {
    margin: 4px 0;
    padding-left: 20px;
  }

  li {
    margin: 1px 0;
    line-height: 1.4;
  }

  hr {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 10px 0;
  }

  a {
    color: #3b82f6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  strong {
    font-weight: 600;
    color: #1a1a1a;
  }
`;

const LoadingContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 80px 20px;
  text-align: center;
`;

const ErrorContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h3 {
    color: #ef4444;
    margin-bottom: 12px;
  }

  p {
    color: #666;
    margin-bottom: 20px;
  }
`;

const AuthInfo = styled.div`
  font-size: 13px;
  color: #666;
`;

const DailyMemoPage = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [authTimeLeft, setAuthTimeLeft] = useState('');

  // 인증 체크
  useEffect(() => {
    setIsMounted(true);

    if (!isAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    // 남은 인증 시간 업데이트
    const updateAuthTime = () => {
      const remaining = getAuthTimeRemaining();
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setAuthTimeLeft(`${hours}시간 ${minutes}분`);
    };

    updateAuthTime();
    const interval = setInterval(updateAuthTime, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, [router]);

  // 정치 리포트 조회
  const { data: politicalData, isLoading: politicalLoading, error: politicalError } = useQuery(
    'latest-political-report',
    async () => {
      const response = await fetch('/api/political-reports');
      if (!response.ok) throw new Error('Failed to fetch political reports');
      return response.json();
    },
    { enabled: isMounted }
  );

  // 법안 리포트 조회
  const { data: billsData, isLoading: billsLoading, error: billsError } = useQuery(
    'latest-bills-report',
    async () => {
      const response = await fetch('/api/bills');
      if (!response.ok) throw new Error('Failed to fetch bills');
      return response.json();
    },
    { enabled: isMounted }
  );

  // 사설 분석 조회
  const { data: editorialData, isLoading: editorialLoading, error: editorialError } = useQuery(
    'latest-editorial-analysis',
    async () => {
      const response = await fetch('/api/editorials');
      if (!response.ok) throw new Error('Failed to fetch editorials');
      return response.json();
    },
    { enabled: isMounted }
  );

  // 메모 텍스트 생성
  useEffect(() => {
    if (!politicalData || !billsData || !editorialData) return;

    const political = politicalData.reports?.[0];
    const bills = billsData.data?.[0];
    const editorial = editorialData.items?.[0];

    if (!political && !bills && !editorial) return;

    const now = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const formatDate = (dateString: string) => {
      if (!dateString) return '';
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
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    let memo = `📋 오늘의 주요 이슈 메모\n생성일시: ${now}\n\n---\n`;

    // 정치 리포트
    if (political) {
      memo += `\n## 📊 정치 리포트\n`;
      memo += `주제: ${political.topic || '정보 없음'}\n`;
      memo += `날짜: ${formatDate(political.created_at)}\n`;
      memo += `${political.summary || '요약 정보가 없습니다.'}\n`;
      memo += `상세보기: ${window.location.origin}/?tab=political&id=${political.slug}\n`;
      memo += `\n---\n`;
    }

    // 법안 리포트
    if (bills) {
      memo += `\n## 📜 오늘의 법안\n`;
      memo += `제목: ${bills.headline || '제목 없음'}\n`;
      memo += `발의일: ${formatShortDate(bills.report_date)}\n`;
      memo += `${bills.overview || '개요 정보가 없습니다.'}\n`;

      if (bills.key_trends && bills.key_trends.length > 0) {
        memo += `\n`;
        bills.key_trends.forEach((trend: string) => {
          memo += `- ${trend}\n`;
        });
      }

      if (bills.statistics) {
        const stats = bills.statistics.regulation;
        memo += `법안 분류: `;
        memo += `신설 ${stats?.new || 0}건, `;
        memo += `강화 ${stats?.strengthen || 0}건, `;
        memo += `완화 ${stats?.relax || 0}건, `;
        memo += `비규제 ${stats?.non_regulatory || 0}건\n`;
      }

      memo += `상세보기: ${window.location.origin}/?tab=bills&id=${bills.slug}\n`;
      memo += `\n---\n`;
    }

    // 사설 분석
    if (editorial) {
      memo += `\n## 📰 오늘의 사설\n`;
      memo += `분석 주제: ${editorial.query || '분석 주제 없음'}\n`;
      memo += `분석일: ${formatShortDate(editorial.analyzed_at)}\n`;

      if (editorial.topics && editorial.topics.length > 0) {
        editorial.topics.forEach((topic: any) => {
          memo += `\n주제 ${topic.topic_number}: ${topic.topic_title}\n`;
          memo += `${topic.topic_summary}\n`;
        });
      }

      memo += `상세보기: ${window.location.origin}/?tab=editorial&id=${editorial.id}\n`;
      memo += `\n---\n`;
    }

    setMemoText(memo);
  }, [politicalData, billsData, editorialData]);

  // 클립보드 복사 (마크다운 문법 제거)
  const handleCopy = async () => {
    try {
      // 마크다운 문법 제거한 평문 텍스트
      const plainText = memoText
        .replace(/\*\*(.*?)\*\*/g, '$1')  // **볼드** 제거
        .replace(/^## /gm, '')             // ## 제거
        .replace(/^### /gm, '')            // ### 제거
        .replace(/^#### /gm, '')           // #### 제거
        .replace(/^---$/gm, '───────')     // --- 를 실선으로
        .trim();

      await navigator.clipboard.writeText(plainText);
      const antdMessage = await import('antd/lib/message');
      antdMessage.default.success('메모가 복사되었습니다!');
    } catch (error) {
      logger.error('Failed to copy memo', error);
      const antdMessage = await import('antd/lib/message');
      antdMessage.default.error('복사에 실패했습니다.');
    }
  };

  // 로그아웃
  const handleLogout = () => {
    clearAuth();
    router.push('/admin/login');
  };

  // 새로고침
  const handleRefresh = () => {
    window.location.reload();
  };

  if (!isMounted) {
    return null;
  }

  const isLoading = politicalLoading || billsLoading || editorialLoading;
  const hasError = !!(politicalError || billsError || editorialError);

  return (
    <>
      <Head>
        <title>오늘의 이슈 메모 - 관리자</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <AdminNav currentPage="daily_memo" />

      <Container>
        <Header>
        <div>
          <Title>📋 오늘의 이슈 메모</Title>
          {authTimeLeft && (
            <AuthInfo>세션 만료: {authTimeLeft} 후</AuthInfo>
          )}
        </div>
        <ButtonGroup>
          <Button onClick={handleRefresh}>🔄 새로고침</Button>
          <Button type="primary" onClick={handleCopy} disabled={isLoading || hasError}>
            📋 복사하기
          </Button>
          <Button onClick={handleLogout}>🚪 로그아웃</Button>
        </ButtonGroup>
      </Header>

      {isLoading && (
        <LoadingContainer>
          <Spin size="large" />
          <p style={{ marginTop: 20, color: '#666' }}>
            최신 리포트를 불러오는 중...
          </p>
        </LoadingContainer>
      )}

      {hasError && (
        <ErrorContainer>
          <h3>⚠️ 데이터 로딩 오류</h3>
          <p>리포트를 불러오는 중 오류가 발생했습니다.</p>
          <Button type="primary" onClick={handleRefresh}>
            다시 시도
          </Button>
        </ErrorContainer>
      )}

      {!isLoading && !hasError && memoText && (
        <MemoCard>
          <MemoContent dangerouslySetInnerHTML={{
            __html: memoText
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
              .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
              .replace(/^#### (.*?)$/gm, '<h4>$1</h4>')
              .replace(/^- (.*?)$/gm, '___LISTITEM___$1___ENDLISTITEM___')
              .replace(/(___LISTITEM___.*?___ENDLISTITEM___(\n___LISTITEM___.*?___ENDLISTITEM___)*)/g, (match) => {
                const items = match.replace(/___LISTITEM___(.*?)___ENDLISTITEM___/g, '<li>$1</li>').replace(/\n/g, '');
                return `<ul>${items}</ul>`;
              })
              .replace(/^---$/gm, '<hr>')
              .replace(/\n/g, '<br>')
              .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
          }} />
        </MemoCard>
      )}
      </Container>
    </>
  );
};

export default dynamic(() => Promise.resolve(DailyMemoPage), { ssr: false });
