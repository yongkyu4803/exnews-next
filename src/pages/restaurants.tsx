import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { RestaurantItem } from '@/types';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 데이터 로드
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/restaurants?all=true');
        
        if (!response.ok) {
          throw new Error('식당 정보를 불러오는데 실패했습니다');
        }
        
        const data = await response.json();
        setRestaurants(data.items || []);
        setError(null);
      } catch (err) {
        console.error('식당 정보 로드 오류:', err);
        setError(err instanceof Error ? err.message : '데이터 로드 오류');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <>
      <Head>
        <title>국회앞 식당 | 식당 정보</title>
        <meta name="description" content="국회앞 식당 정보 목록" />
      </Head>

      <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>국회앞 식당</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <Link href="/">
            <a style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#1a4b8c', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
              ← 메인으로 돌아가기
            </a>
          </Link>
        </div>
        
        {loading ? (
          <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <p>식당 정보를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div style={{ backgroundColor: '#fff0f0', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2>오류가 발생했습니다</h2>
            <p>{error}</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2>데이터가 없습니다</h2>
            <p>식당 정보가 없습니다. 나중에 다시 시도해주세요.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2>국회앞 식당 목록 ({restaurants.length}개)</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>카테고리</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>이름</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>위치</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>연락처</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>가격대</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>비고</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map(restaurant => (
                  <tr key={restaurant.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{restaurant.category}</td>
                    <td style={{ padding: '8px' }}>
                      {restaurant.link ? (
                        <a href={restaurant.link} target="_blank" rel="noopener noreferrer" style={{ color: '#1a4b8c', textDecoration: 'none' }}>
                          {restaurant.name}
                        </a>
                      ) : (
                        restaurant.name
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>{restaurant.location}</td>
                    <td style={{ padding: '8px' }}>{restaurant.pnum}</td>
                    <td style={{ padding: '8px' }}>{restaurant.price}</td>
                    <td style={{ padding: '8px' }}>{restaurant.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// SSR 설정
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {} // 초기 props 전달
  };
}; 