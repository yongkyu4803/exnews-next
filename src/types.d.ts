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
    static Text: React.FC<{ type?: string; children?: React.ReactNode; strong?: boolean; italic?: boolean; }>;
    static Paragraph: React.FC<{ children?: React.ReactNode; style?: React.CSSProperties; }>;
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
    style?: React.CSSProperties;
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
    danger?: boolean;
  }

  export const Button: React.FC<ButtonProps>;

  // Tag 컴포넌트
  interface TagProps {
    color?: string;
    closable?: boolean;
    visible?: boolean;
    onClose?: (e: React.MouseEvent<HTMLElement>) => void;
    style?: React.CSSProperties;
    className?: string;
    closeIcon?: React.ReactNode;
    children?: React.ReactNode;
  }

  export const Tag: React.FC<TagProps>;

  // Table 컴포넌트
  interface ColumnType<T> {
    title: React.ReactNode;
    dataIndex?: string;
    key?: string;
    width?: number | string;
    render?: (text: any, record: T, index: number) => React.ReactNode;
    ellipsis?: boolean;
  }

  interface TableProps<T> {
    columns?: ColumnType<T>[];
    dataSource?: T[];
    rowKey?: string | ((record: T) => string);
    pagination?: {
      current?: number;
      pageSize?: number;
      total?: number;
      onChange?: (page: number, pageSize?: number) => void;
      showSizeChanger?: boolean;
      showTotal?: (total: number) => React.ReactNode;
    } | false;
    loading?: boolean;
    scroll?: { x?: number | string; y?: number | string };
    className?: string;
    style?: React.CSSProperties;
  }

  export class Table<T = any> extends React.Component<TableProps<T>> {}

  // Card 컴포넌트
  interface CardProps {
    title?: React.ReactNode;
    bordered?: boolean;
    hoverable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
  }

  export const Card: React.FC<CardProps>;

  // Switch 컴포넌트
  interface SwitchProps {
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    style?: React.CSSProperties;
  }
  
  export const Switch: React.FC<SwitchProps>;
  
  // Checkbox 컴포넌트
  interface CheckboxProps {
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (e: { target: { checked: boolean } }) => void;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }
  
  export const Checkbox: React.FC<CheckboxProps>;
  
  // Divider 컴포넌트
  interface DividerProps {
    type?: 'horizontal' | 'vertical';
    orientation?: 'left' | 'right' | 'center';
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }
  
  export const Divider: React.FC<DividerProps>;
  
  // Modal 컴포넌트
  interface ModalProps {
    title?: React.ReactNode;
    visible?: boolean;
    open?: boolean;
    onOk?: (e: React.MouseEvent<HTMLElement>) => void;
    onCancel?: (e: React.MouseEvent<HTMLElement>) => void;
    footer?: React.ReactNode;
    width?: string | number;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }
  
  export const Modal: React.FC<ModalProps>;
  
  // Empty 컴포넌트
  interface EmptyProps {
    description?: React.ReactNode;
    image?: string | React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }
  
  export const Empty: React.FC<EmptyProps> & {
    PRESENTED_IMAGE_DEFAULT: string;
    PRESENTED_IMAGE_SIMPLE: string;
  };
  
  // Skeleton 컴포넌트
  interface SkeletonProps {
    active?: boolean;
    loading?: boolean;
    paragraph?: boolean | { rows?: number };
    title?: boolean | { width?: string | number };
    avatar?: boolean | { size?: 'large' | 'small' | 'default' | number };
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }
  
  export const Skeleton: React.FC<SkeletonProps>;
}

// react-swipeable 타입 확장
declare module 'react-swipeable' {
  interface SwipeableHandlers {
    onSwiping: (e: { deltaX: number; deltaY: number }) => void;
    onSwipedLeft: () => void;
    onSwipedRight: () => void;
    onTouchStart?: React.EventHandler<React.TouchEvent>;
    onTouchMove?: React.EventHandler<React.TouchEvent>;
    onTouchEnd?: React.EventHandler<React.TouchEvent>;
  }
  
  interface SwipeableOptions {
    delta?: number;
    preventDefaultTouchmoveEvent?: boolean;
    trackMouse?: boolean;
    trackTouch?: boolean;
    rotationAngle?: number;
  }
  
  export function useSwipeable(options: SwipeableOptions & {
    onSwiping?: (e: { deltaX: number; deltaY: number }) => void;
    onSwipedLeft?: () => void;
    onSwipedRight?: () => void;
    onSwipedUp?: () => void;
    onSwipedDown?: () => void;
  }): SwipeableHandlers;
} 