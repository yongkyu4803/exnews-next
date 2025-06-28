import React from 'react';

interface RefreshIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const RefreshIcon: React.FC<RefreshIconProps> = ({ 
  width = 16, 
  height = 16, 
  className 
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    width={width} 
    height={height}
    className={className}
  >
    <path d="M23 4v6h-6"></path>
    <path d="M1 20v-6h6"></path>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
  </svg>
);

export default RefreshIcon;
