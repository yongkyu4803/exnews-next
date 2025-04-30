declare module 'react-pull-to-refresh' {
  import * as React from 'react';

  export interface ReactPullToRefreshProps {
    onRefresh: () => Promise<any>;
    resistance?: number;
    pullDownThreshold?: number;
    children?: React.ReactNode;
  }

  const PullToRefresh: React.FC<ReactPullToRefreshProps>;
  export default PullToRefresh;
} 