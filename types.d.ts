declare module 'react-pull-to-refresh' {
  import React from 'react';
  
  interface ReactPullToRefreshProps {
    onRefresh: () => Promise<any>;
    resistance?: number;
    pullDownContent?: React.ReactNode;
    releaseContent?: React.ReactNode;
    refreshContent?: React.ReactNode;
    children: React.ReactNode;
  }
  
  const PullToRefresh: React.FC<ReactPullToRefreshProps>;
  export default PullToRefresh;
}

declare module 'react-window-infinite-loader' {
  import { Component, ComponentType, ReactNode } from 'react';
  import { ListOnItemsRenderedProps } from 'react-window';
  
  interface InfiniteLoaderProps {
    isItemLoaded: (index: number) => boolean;
    itemCount: number;
    loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void> | void;
    threshold?: number;
    minimumBatchSize?: number;
    children: (props: {
      onItemsRendered: (props: ListOnItemsRenderedProps) => void;
      ref: (ref: any) => void;
    }) => ReactNode;
  }
  
  class InfiniteLoader extends Component<InfiniteLoaderProps> {}
  export default InfiniteLoader;
}

// antd 컴포넌트에 대한 타입 정의
declare module 'antd' {
  import React from 'react';
  
  // 메시지 컴포넌트
  interface MessageType {
    success: (content: React.ReactNode, duration?: number, onClose?: () => void) => void;
    error: (content: React.ReactNode, duration?: number, onClose?: () => void) => void;
    info: (content: React.ReactNode, duration?: number, onClose?: () => void) => void;
    warning: (content: React.ReactNode, duration?: number, onClose?: () => void) => void;
    loading: (content: React.ReactNode, duration?: number, onClose?: () => void) => void;
  }
  
  export const message: MessageType;

  // Typography 컴포넌트
  interface TitleProps {
    level?: 1 | 2 | 3 | 4 | 5;
    className?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
  }

  interface TypographyProps {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export class Typography extends React.Component<TypographyProps> {
    static Title: React.FC<TitleProps>;
  }

  // Space 컴포넌트
  interface SpaceProps {
    size?: 'small' | 'middle' | 'large' | number;
    direction?: 'horizontal' | 'vertical';
    align?: 'start' | 'end' | 'center' | 'baseline';
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export const Space: React.FC<SpaceProps>;

  // Alert 컴포넌트
  interface AlertProps {
    type?: 'success' | 'info' | 'warning' | 'error';
    message: React.ReactNode;
    description?: React.ReactNode;
    showIcon?: boolean;
    closable?: boolean;
    className?: string;
    style?: React.CSSProperties;
  }

  export const Alert: React.FC<AlertProps>;

  // Tabs 컴포넌트
  interface TabItemType {
    key: string;
    label: React.ReactNode;
    children?: React.ReactNode;
    disabled?: boolean;
    className?: string;
  }

  interface TabsProps {
    activeKey?: string;
    defaultActiveKey?: string;
    onChange?: (activeKey: string) => void;
    type?: 'line' | 'card';
    size?: 'large' | 'default' | 'small';
    tabPosition?: 'top' | 'right' | 'bottom' | 'left';
    items?: TabItemType[];
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export const Tabs: React.FC<TabsProps>;

  // Button 컴포넌트
  interface ButtonProps {
    type?: 'primary' | 'ghost' | 'dashed' | 'link' | 'text' | 'default';
    size?: 'large' | 'middle' | 'small';
    disabled?: boolean;
    loading?: boolean | { delay?: number };
    onClick?: React.MouseEventHandler<HTMLElement>;
    href?: string;
    icon?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export const Button: React.FC<ButtonProps>;
} 