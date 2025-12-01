import React from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SkeletonCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`

const SkeletonLine = styled.div<{ width: string; height?: string }>`
  width: ${props => props.width};
  height: ${props => props.height || '14px'};
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
`

const SkeletonNewsCard: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <SkeletonWrapper>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index}>
          <SkeletonLine width="90%" height="16px" />
          <SkeletonLine width="70%" />
          <SkeletonLine width="40%" height="12px" />
        </SkeletonCard>
      ))}
    </SkeletonWrapper>
  )
}

export default SkeletonNewsCard
