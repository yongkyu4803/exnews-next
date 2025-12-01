import React from 'react';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import styles from '@/styles/dashboard/layout.module.css';

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  icon?: React.ReactNode;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  suffix = '개',
  trend = 'stable',
  change = 0,
  icon,
  color = '#1a4b8c',
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpOutlined style={{ color: '#06d6a0' }} />;
      case 'down':
        return <ArrowDownOutlined style={{ color: '#ef476f' }} />;
      default:
        return <MinusOutlined style={{ color: '#6b7280' }} />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#06d6a0';
      case 'down':
        return '#ef476f';
      default:
        return '#6b7280';
    }
  };

  return (
    <div
      className={styles.card}
      style={{
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 14,
            color: 'var(--gqai-text-secondary)',
            marginBottom: 8,
            fontWeight: 500,
          }}>
            {title}
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--gqai-text-primary)',
            fontFamily: 'var(--gqai-font-display)',
          }}>
            {value.toLocaleString()} {suffix}
          </div>
          {change !== 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
              fontSize: 13,
              color: getTrendColor(),
            }}>
              {getTrendIcon()}
              <span>
                {Math.abs(change)} {change > 0 ? '증가' : '감소'}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            fontSize: 36,
            color,
            opacity: 0.15,
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// 🚀 Phase 2.3: React.memo로 불필요한 재렌더링 방지
export default React.memo(StatsCard);
