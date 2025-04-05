import React from 'react';
import styled from '@emotion/styled';

interface TabItem {
  key: string;
  label: string;
}

interface SimpleTabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

const TabsContainer = styled.div`
  display: flex;
  width: 100%;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  position: relative;
`;

const TabButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: 12px 8px;
  background-color: ${props => props.isActive ? 'var(--primary-color, #1a73e8)' : 'transparent'};
  color: ${props => props.isActive ? 'white' : '#333'};
  border: none;
  outline: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: ${props => props.isActive ? 'bold' : 'normal'};
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background-color: ${props => props.isActive ? 'var(--primary-color, #1a73e8)' : 'rgba(0, 0, 0, 0.05)'};
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: ${props => props.isActive ? 'white' : 'transparent'};
    transform: ${props => props.isActive ? 'scaleX(1)' : 'scaleX(0)'};
    transition: transform 0.2s ease;
  }
`;

const SimpleTabs: React.FC<SimpleTabsProps> = ({ items, activeKey, onChange }) => {
  const handleTabClick = (key: string) => {
    console.log('탭 클릭:', key);
    onChange(key);
  };

  return (
    <TabsContainer>
      {items.map(item => (
        <TabButton
          key={item.key}
          isActive={activeKey === item.key}
          onClick={() => handleTabClick(item.key)}
          type="button"
        >
          {item.label}
        </TabButton>
      ))}
    </TabsContainer>
  );
};

export default SimpleTabs; 