import React from 'react';
import styled from '@emotion/styled';

interface MicroButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const ButtonContainer = styled.button<{ bgColor?: string; disabled?: boolean }>`
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  min-height: 40px !important;
  max-width: 40px !important;
  max-height: 40px !important;
  padding: 8px !important;
  border-radius: 50%;
  background-color: ${props => props.disabled ? '#cccccc' : props.bgColor || 'var(--primary-color, #1a73e8)'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  z-index: 100;
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.7 : 1};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  &:active {
    transform: ${props => props.disabled ? 'none' : 'scale(0.95)'};
  }
  
  svg {
    width: 20px !important;
    height: 20px !important;
    max-width: 20px !important;
    max-height: 20px !important;
  }
`;

export const MicroButton: React.FC<MicroButtonProps> = ({ 
  onClick, 
  icon, 
  label, 
  color, 
  style,
  disabled = false
}) => (
  <ButtonContainer 
    onClick={disabled ? undefined : onClick} 
    aria-label={label}
    bgColor={color}
    style={style}
    disabled={disabled}
  >
    {icon}
  </ButtonContainer>
);

export default MicroButton; 