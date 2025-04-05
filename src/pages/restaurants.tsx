import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

export default function RestaurantsPage() {
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
        
        <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2>곧 서비스가 오픈됩니다</h2>
          <p>국회앞 식당 정보 서비스 준비 중입니다. 조금만 기다려주세요!</p>
          <p>식당 정보는 '한식', '양식', '중식', '일식', '분식', '기타' 카테고리로 구분되어 제공될 예정입니다.</p>
        </div>
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