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

const SkeletonCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
`

const SkeletonHeader = styled.div`
  width: 50%;
  height: 20px;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 20px;
`

const SkeletonContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SkeletonLine = styled.div<{ width: string; height?: string }>`
  width: ${props => props.width};
  height: ${props => props.height || '16px'};
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

interface SkeletonWidgetProps {
  lines?: number
}

const SkeletonWidget: React.FC<SkeletonWidgetProps> = ({ lines = 5 }) => {
  return (
    <SkeletonCard>
      <SkeletonHeader />
      <SkeletonContent>
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonLine
            key={index}
            width={index === lines - 1 ? '60%' : '100%'}
            height={index === 0 ? '20px' : '16px'}
          />
        ))}
      </SkeletonContent>
    </SkeletonCard>
  )
}

export default SkeletonWidget
