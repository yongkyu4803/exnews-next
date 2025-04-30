import React from 'react';
import dynamic from 'next/dynamic';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedCategory } from '@/store/slices/uiSlice';
import { RootState } from '@/store';

// 동적 임포트
const Tabs = dynamic(() => import('antd/lib/tabs'), { ssr: false }) as any;

const CategoryTabs: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedCategory } = useSelector((state: RootState) => state.ui);
  const { categories } = useSelector((state: RootState) => state.data);

  const handleCategoryChange = (category: string) => {
    dispatch(setSelectedCategory(category));
  };

  // TabPane 대신 items 속성 사용
  const items = [
    { key: 'all', label: '전체' },
    ...categories.map(category => ({
      key: category,
      label: category
    }))
  ];

  return (
    <Tabs 
      activeKey={selectedCategory} 
      onChange={handleCategoryChange}
      type="card"
      className="category-tabs"
      items={items}
    />
  );
};

export default CategoryTabs;