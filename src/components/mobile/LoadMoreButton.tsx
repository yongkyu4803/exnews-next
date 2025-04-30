import React from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';

// 동적 임포트
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;

const StyledButton = styled(Button)`
  width: 100%;
  margin-top: 16px;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
`;

interface LoadMoreButtonProps {
  loading: boolean;
  hasMore: boolean;
  onClick: () => void;
}

export default function LoadMoreButton({ loading, hasMore, onClick }: LoadMoreButtonProps) {
  if (!hasMore) return null;
  
  return (
    <StyledButton 
      loading={loading}
      onClick={onClick}
      type="default"
    >
      더보기
    </StyledButton>
  );
}