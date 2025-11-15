import React, { ReactNode } from 'react';
import DashboardHeader from './DashboardHeader';
import styles from '@/styles/dashboard/layout.module.css';

interface DashboardLayoutProps {
  children?: ReactNode;
  leftPanel?: ReactNode;
  mainPanel?: ReactNode;
  rightPanel?: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  leftPanel,
  mainPanel,
  rightPanel,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className={styles.dashboardContainer}>
      <DashboardHeader activeTab={activeTab} onTabChange={onTabChange} />

      {children || (
        <main className={styles.dashboardMain}>
          {/* Left Panel */}
          <aside className={styles.leftPanel}>
            {leftPanel}
          </aside>

          {/* Main Panel */}
          <section className={styles.mainPanel}>
            {mainPanel}
          </section>

          {/* Right Panel */}
          <aside className={styles.rightPanel}>
            {rightPanel}
          </aside>
        </main>
      )}
    </div>
  );
};

export default DashboardLayout;
