import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { RestaurantItem } from '@/types';

// Antd 컴포넌트 동적 로딩
const Tabs = dynamic(() => import('antd/lib/tabs'), { ssr: false }) as any;
const Badge = dynamic(() => import('antd/lib/badge'), { ssr: false }) as any;
const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false }) as any;

interface RestaurantBuildingViewProps {
  items: RestaurantItem[];
  selectedKeys?: React.Key[];
  onSelectChange?: (keys: React.Key[], rows: RestaurantItem[]) => void;
}

interface BuildingGroup {
  buildingName: string;
  restaurants: RestaurantItem[];
  count: number;
}

export default function RestaurantBuildingView({ 
  items, 
  selectedKeys = [], 
  onSelectChange 
}: RestaurantBuildingViewProps) {

  // 빌딩별로 그룹화
  const buildingGroups: BuildingGroup[] = useMemo(() => {
    const groups: { [key: string]: RestaurantItem[] } = {};
    
    items.forEach(item => {
      const buildingName = item.building_name || '기타 지역';
      if (!groups[buildingName]) {
        groups[buildingName] = [];
      }
      groups[buildingName].push(item);
    });

    return Object.entries(groups)
      .map(([buildingName, restaurants]) => ({
        buildingName,
        restaurants,
        count: restaurants.length
      }))
      .sort((a, b) => b.count - a.count); // 많은 순으로 정렬
  }, [items]);

  // 카테고리별 색상
  const getCategoryColor = (category: string) => {
    const colorMap: {[key: string]: string} = {
      '중식': '#ff4d4f',
      '일식/해산물': '#1677ff', 
      '이탈리안': '#52c41a',
      '카페': '#722ed1',
      '한정식': '#fa8c16',
      '기타': '#8c8c8c'
    };
    return colorMap[category] || '#8c8c8c';
  };

  // 체크박스 변경 핸들러
  const handleRestaurantSelect = (restaurant: RestaurantItem, checked: boolean) => {
    if (!onSelectChange) return;

    const itemKey = restaurant.id?.toString() || restaurant.name;
    const newSelectedKeys = checked 
      ? [...selectedKeys, itemKey]
      : selectedKeys.filter(key => key !== itemKey);

    const newSelectedRows = items.filter(item => 
      newSelectedKeys.includes(item.id?.toString() || item.name)
    );

    onSelectChange(newSelectedKeys, newSelectedRows);
  };

  // 빌딩 전체 선택/해제
  const handleBuildingSelectAll = (building: BuildingGroup, checked: boolean) => {
    if (!onSelectChange) return;

    const buildingKeys = building.restaurants.map(r => r.id?.toString() || r.name);
    
    const newSelectedKeys = checked
      ? Array.from(new Set([...selectedKeys, ...buildingKeys]))
      : selectedKeys.filter(key => !buildingKeys.includes(key as string));

    const newSelectedRows = items.filter(item => 
      newSelectedKeys.includes(item.id?.toString() || item.name)
    );

    onSelectChange(newSelectedKeys, newSelectedRows);
  };

  // 빌딩의 선택 상태 확인
  const getBuildingSelectState = (building: BuildingGroup) => {
    const buildingKeys = building.restaurants.map(r => r.id?.toString() || r.name);
    const selectedBuildingKeys = buildingKeys.filter(key => selectedKeys.includes(key));
    
    if (selectedBuildingKeys.length === 0) return 'none';
    if (selectedBuildingKeys.length === buildingKeys.length) return 'all';
    return 'partial';
  };

  // 탭 아이템 생성
  const tabItems = buildingGroups.map((building, index) => {
    const selectState = getBuildingSelectState(building);
    
    return {
      key: building.buildingName,
      label: (
        <Badge count={building.count} showZero>
          <span>{building.buildingName}</span>
        </Badge>
      ),
      children: (
        <div>
          {/* 빌딩 전체 선택 체크박스 */}
          {onSelectChange && (
            <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectState === 'all'}
                  ref={input => {
                    if (input) input.indeterminate = selectState === 'partial';
                  }}
                  onChange={(e) => handleBuildingSelectAll(building, e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <Typography.Text strong>
                  {building.buildingName} 전체 선택 ({building.count}개)
                </Typography.Text>
              </label>
            </div>
          )}

          {/* 식당 목록 */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {building.restaurants.map((restaurant) => {
              const isSelected = selectedKeys.includes(restaurant.id?.toString() || restaurant.name);
              
              return (
                <div
                  key={restaurant.id || restaurant.name}
                  style={{ 
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #1677ff' : '1px solid #d9d9d9',
                    backgroundColor: isSelected ? '#f6ffed' : '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => onSelectChange && handleRestaurantSelect(restaurant, !isSelected)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        {onSelectChange && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleRestaurantSelect(restaurant, e.target.checked);
                            }}
                            style={{ marginRight: '8px' }}
                          />
                        )}
                        <Typography.Text strong style={{ fontSize: '16px' }}>
                          {restaurant.link ? (
                            <a 
                              href={restaurant.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {restaurant.name}
                            </a>
                          ) : (
                            restaurant.name
                          )}
                        </Typography.Text>
                        <span 
                          style={{ 
                            marginLeft: '8px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#fff',
                            backgroundColor: getCategoryColor(restaurant.category)
                          }}
                        >
                          {restaurant.category}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
                        <div>📍 {restaurant.location}</div>
                        {restaurant.pnum && <div>📞 {restaurant.pnum}</div>}
                        {restaurant.price && <div>💰 {restaurant.price}</div>}
                        {restaurant.remark && <div style={{ color: '#999' }}>💬 {restaurant.remark}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )
    };
  });

  return (
    <div style={{ marginTop: '16px' }}>
      <Typography.Title level={4} style={{ marginBottom: '16px' }}>
        🏢 빌딩별 식당 보기 (총 {items.length}개)
      </Typography.Title>
      
      <Tabs
        defaultActiveKey={buildingGroups[0]?.buildingName}
        items={tabItems}
        type="card"
      />
    </div>
  );
}