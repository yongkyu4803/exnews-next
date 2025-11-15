import React from 'react';
import styles from '@/styles/dashboard/layout.module.css';

interface Category {
  key: string;
  label: string;
  count?: number;
  color?: string;
}

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (key: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  const getCategoryStyle = (key: string) => {
    const isActive = activeCategory === key;
    return {
      padding: '10px 16px',
      borderRadius: 'var(--gqai-radius-md)',
      cursor: 'pointer',
      transition: 'all var(--gqai-transition-fast)',
      backgroundColor: isActive ? 'var(--gqai-primary)' : 'transparent',
      color: isActive ? 'white' : 'var(--gqai-text-primary)',
      fontWeight: isActive ? 600 : 400,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    };
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>카테고리</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {categories.map(category => (
          <div
            key={category.key}
            style={getCategoryStyle(category.key)}
            onClick={() => onCategoryChange(category.key)}
            onMouseEnter={(e) => {
              if (activeCategory !== category.key) {
                e.currentTarget.style.backgroundColor = 'var(--gqai-bg-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== category.key) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span>{category.label}</span>
            {category.count !== undefined && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: activeCategory === category.key
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'var(--gqai-bg-active)',
                  color: activeCategory === category.key
                    ? 'white'
                    : 'var(--gqai-text-secondary)',
                }}
              >
                {category.count}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
