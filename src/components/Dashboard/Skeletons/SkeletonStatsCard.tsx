import React from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

// Shimmer 애니메이션
const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

const SkeletonCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
`

const SkeletonTitle = styled.div`
  width: 60%;
  height: 14px;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 16px;
`

const SkeletonValue = styled.div`
  width: 80%;
  height: 32px;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
`

const SkeletonTrend = styled.div`
  width: 40%;
  height: 12px;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 4px;
`

const SkeletonStatsCard: React.FC = () => {
  return (
    <SkeletonCard>
      <SkeletonTitle />
      <SkeletonValue />
      <SkeletonTrend />
    </SkeletonCard>
  )
}

export default SkeletonStatsCard
