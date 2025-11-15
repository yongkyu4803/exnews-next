import React from 'react';
import { useRouter } from 'next/router';
import { SearchOutlined, BellOutlined, UserOutlined } from '@ant-design/icons';
import styles from '@/styles/dashboard/layout.module.css';

interface DashboardHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ activeTab = 'home', onTabChange }) => {
  const router = useRouter();

  const navItems = [
    { key: 'home', label: '대시보드' },
    { key: 'exclusive', label: '단독' },
    { key: 'ranking', label: '랭킹' },
    { key: 'editorial', label: '사설' },
    { key: 'political', label: '정치' },
    { key: 'bills', label: '법안' },
    { key: 'restaurant', label: '레스토랑' },
  ];

  const handleNavClick = (key: string) => {
    if (key === 'home') {
      router.push('/dashboard');
    } else {
      router.push(`/?tab=${key}`);
    }
    if (onTabChange) {
      onTabChange(key);
    }
  };

  return (
    <header className={styles.dashboardHeader}>
      <div className={styles.headerContent}>
        {/* Logo */}
        <div
          className={styles.logo}
          onClick={() => router.push('/')}
        >
          GQ<span className={styles.logoAccent}>AI</span>
        </div>

        {/* Navigation */}
        <nav className={styles.headerNav}>
          {navItems.map(item => (
            <div
              key={item.key}
              className={`${styles.navItem} ${activeTab === item.key ? styles.navItemActive : ''}`}
              onClick={() => handleNavClick(item.key)}
            >
              {item.label}
            </div>
          ))}
        </nav>

        {/* Actions */}
        <div className={styles.headerActions}>
          <SearchOutlined
            style={{
              fontSize: 20,
              color: 'white',
              cursor: 'pointer',
            }}
            onClick={() => {
              // TODO: Open search modal
              console.log('Search clicked');
            }}
          />

          <BellOutlined
            style={{
              fontSize: 20,
              color: 'white',
              cursor: 'pointer'
            }}
          />

          <UserOutlined
            style={{
              fontSize: 20,
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={() => router.push('/admin/login')}
          />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
