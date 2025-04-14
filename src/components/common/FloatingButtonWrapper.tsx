import React from 'react';
import styled from '@emotion/styled';

interface FloatingButtonWrapperProps {
  children: React.ReactNode;
  position?: 'primary' | 'secondary';
  bottom?: number;
}

const Wrapper = styled.div<{ position: string; bottom: number }>`
  position: fixed;
  bottom: ${props => props.bottom}px;
  right: ${props => props.position === 'primary' ? '16px' : '66px'};
  z-index: 1000;
`;

export const FloatingButtonWrapper: React.FC<FloatingButtonWrapperProps> = ({ 
  children, 
  position = 'primary',
  bottom = 70
}) => (
  <Wrapper position={position} bottom={bottom}>
    {children}
  </Wrapper>
);

export default FloatingButtonWrapper; 