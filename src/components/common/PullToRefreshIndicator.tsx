import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
  isPulling: boolean;
}

// 회전 애니메이션
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// 컨테이너 스타일
const IndicatorContainer = styled.div<{ pullDistance: number; isRefreshing: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  pointer-events: none;

  /* 당김 거리에 따라 위치 조정 */
  transform: translateY(${props => props.isRefreshing ? '0px' : `${props.pullDistance - 60}px`});

  /* 부드러운 전환 */
  transition: ${props => props.isRefreshing ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'};

  opacity: ${props => props.pullDistance > 10 ? 1 : 0};
`;

// 인디케이터 원
const Indicator = styled.div<{
  rotation: number;
  isReady: boolean;
  isRefreshing: boolean;
}>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;

  /* 당김 거리에 따른 회전 */
  transform: rotate(${props => props.rotation}deg);

  /* 색상 변경 (threshold 도달 시) */
  border: 3px solid ${props => {
    if (props.isRefreshing) return '#52c41a'; // 새로고침 중: 녹색
    if (props.isReady) return '#1890ff'; // 준비 완료: 파란색
    return '#d9d9d9'; // 기본: 회색
  }};

  /* 새로고침 중 회전 애니메이션 */
  animation: ${props => props.isRefreshing ? spin : 'none'} 1s linear infinite;

  transition: border-color 0.2s ease-in-out;
`;

// 화살표 아이콘
const Arrow = styled.div<{ isReady: boolean }>`
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 12px solid ${props => props.isReady ? '#1890ff' : '#666'};
  transition: border-top-color 0.2s ease-in-out;
`;

// 로딩 스피너 (3개 점)
const LoadingDots = styled.div`
  display: flex;
  gap: 4px;
`;

const Dot = styled.div<{ delay: number }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #52c41a;
  animation: ${keyframes`
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1.2); }
  `} 1.4s infinite ease-in-out;
  animation-delay: ${props => props.delay}s;
`;

// 텍스트 레이블
const Label = styled.div<{ isReady: boolean }>`
  margin-top: 8px;
  font-size: 12px;
  color: ${props => props.isReady ? '#1890ff' : '#999'};
  font-weight: 500;
  transition: color 0.2s ease-in-out;
`;

/**
 * Pull-to-Refresh 시각적 인디케이터
 *
 * 당김 거리에 따라:
 * - 아이콘 회전
 * - 색상 변경
 * - 텍스트 표시
 * - 로딩 애니메이션
 */
export default function PullToRefreshIndicator({
  pullDistance,
  threshold,
  isRefreshing,
  isPulling
}: PullToRefreshIndicatorProps) {
  // 표시 여부 (당김 거리가 10px 이상일 때만)
  if (pullDistance < 10 && !isRefreshing) {
    return null;
  }

  // threshold 도달 여부
  const isReady = pullDistance >= threshold;

  // 회전 각도 계산 (0-360도)
  // pullDistance가 threshold에 가까워질수록 360도에 가까워짐
  const rotation = Math.min((pullDistance / threshold) * 360, 360);

  // 텍스트 레이블
  const getLabelText = () => {
    if (isRefreshing) return '새로고침 중...';
    if (isReady) return '놓아서 새로고침';
    return '당겨서 새로고침';
  };

  return (
    <div>
      <IndicatorContainer pullDistance={pullDistance} isRefreshing={isRefreshing}>
        <div style={{ textAlign: 'center' }}>
          <Indicator
            rotation={rotation}
            isReady={isReady}
            isRefreshing={isRefreshing}
          >
            {isRefreshing ? (
              <LoadingDots>
                <Dot delay={0} />
                <Dot delay={0.2} />
                <Dot delay={0.4} />
              </LoadingDots>
            ) : (
              <Arrow isReady={isReady} />
            )}
          </Indicator>

          <Label isReady={isReady}>
            {getLabelText()}
          </Label>
        </div>
      </IndicatorContainer>
    </div>
  );
}
