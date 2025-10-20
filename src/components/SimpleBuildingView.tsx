import React, { useMemo, useState, useEffect } from 'react';
import { RestaurantItem } from '@/types';

interface SimpleBuildingViewProps {
  items: RestaurantItem[];
}

interface BuildingGroup {
  buildingName: string;
  restaurants: RestaurantItem[];
  count: number;
}

export default function SimpleBuildingView({ items }: SimpleBuildingViewProps) {
  const [activeTab, setActiveTab] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const buildingGroups = useMemo(() => {
    const groups: { [key: string]: RestaurantItem[] } = {};
    
    items.forEach(item => {
      const buildingName = item.building_name || '기타 지역';
      if (!groups[buildingName]) {
        groups[buildingName] = [];
      }
      groups[buildingName].push(item);
    });

    const sortedGroups = Object.entries(groups)
      .map(([buildingName, restaurants]) => ({
        buildingName,
        restaurants,
        count: restaurants.length
      }))
      .filter(group => group.count >= 3) // 3개 이상인 빌딩만 표시
      .sort((a, b) => b.count - a.count);

    // 첫 번째 빌딩을 기본 활성 탭으로 설정
    if (sortedGroups.length > 0 && !activeTab) {
      setActiveTab(sortedGroups[0].buildingName);
    }

    return sortedGroups;
  }, [items, activeTab]);

  // 카테고리별 색상 매핑
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

  const currentBuilding = buildingGroups.find(b => b.buildingName === activeTab);

  return (
    <div style={{ marginTop: '16px' }}>
      {/* 제목 */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f0f8ff',
        borderRadius: '8px'
      }}>
        <h2 style={{ 
          margin: '0 0 8px 0', 
          color: '#1677ff',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          🏢 빌딩별 식당 보기
        </h2>
        <p style={{ 
          margin: '0', 
          color: '#666',
          fontSize: '14px'
        }}>
          총 {items.length}개 식당 중 3개 이상인 {buildingGroups.length}개 빌딩 표시
        </p>
      </div>

      {/* 탭 헤더 */}
      <div style={{ 
        display: 'flex', 
        flexWrap: isMobile ? 'nowrap' : 'wrap',
        overflowX: isMobile ? 'auto' : 'visible',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '16px',
        paddingRight: isMobile ? '16px' : '0'
      }}>
        {buildingGroups.map((building) => (
          <button
            key={building.buildingName}
            onClick={() => setActiveTab(building.buildingName)}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              backgroundColor: activeTab === building.buildingName ? '#1677ff' : '#f5f5f5',
              color: activeTab === building.buildingName ? 'white' : '#666',
              fontWeight: activeTab === building.buildingName ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              fontSize: '14px',
              minWidth: isMobile ? '100px' : '120px',
              textAlign: 'center',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (activeTab !== building.buildingName) {
                e.currentTarget.style.backgroundColor = '#e6f7ff';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== building.buildingName) {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }
            }}
          >
            <div>{building.buildingName}</div>
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.8,
              marginTop: '2px'
            }}>
              {building.count}개 식당
            </div>
          </button>
        ))}
      </div>

      {/* 현재 활성 빌딩의 식당 목록 */}
      {currentBuilding && (
        <div>
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            borderLeft: '4px solid #1677ff'
          }}>
            <h3 style={{ 
              margin: '0 0 4px 0',
              color: '#1677ff',
              fontSize: '18px'
            }}>
              🏢 {currentBuilding.buildingName}
            </h3>
            <p style={{ 
              margin: '0',
              color: '#666',
              fontSize: '14px'
            }}>
              {currentBuilding.count}개의 식당이 있습니다
            </p>
          </div>

          {/* 식당 카드 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {currentBuilding.restaurants.map((restaurant) => (
              <div
                key={restaurant.id || restaurant.name}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e8e8e8',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                {/* 식당 이름 및 카테고리 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <h4 style={{ 
                    margin: '0',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#333',
                    flex: 1
                  }}>
                    {restaurant.link ? (
                      <a 
                        href={restaurant.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          color: '#1677ff',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        {restaurant.name}
                      </a>
                    ) : (
                      restaurant.name
                    )}
                  </h4>
                  <span style={{
                    backgroundColor: getCategoryColor(restaurant.category),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginLeft: '8px',
                    whiteSpace: 'nowrap'
                  }}>
                    {restaurant.category}
                  </span>
                </div>

                {/* 식당 정보 */}
                <div style={{ 
                  lineHeight: '1.6',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: '500' }}>📍</span> {restaurant.location}
                  </div>
                  {restaurant.pnum && (
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontWeight: '500' }}>📞</span> {restaurant.pnum}
                    </div>
                  )}
                  {restaurant.price && (
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontWeight: '500' }}>💰</span> {restaurant.price}
                    </div>
                  )}
                  {restaurant.remark && (
                    <div style={{ 
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontStyle: 'italic'
                    }}>
                      💬 {restaurant.remark}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}