import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { verifyPassword, setAuthToken, isAuthenticated } from '@/utils/adminAuth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Pages:Admin:Login');

const AdminLoginPage = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    setIsMounted(true);

    // If already authenticated, redirect to analytics
    if (isAuthenticated()) {
      router.push('/admin/analytics');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isValid = await verifyPassword(password);

      if (isValid) {
        setAuthToken();
        logger.info('Admin login successful');
        router.push('/admin/analytics');
      } else {
        setError('비밀번호가 올바르지 않습니다.');
        logger.warn('Failed admin login attempt');
        setLoading(false);
      }
    } catch (err) {
      logger.error('Login error', err);
      setError('로그인 처리 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Head>
        <title>관리자 로그인 - NEWS-GQAI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'white',
        borderRadius: '8px',
        padding: '32px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            fontFamily: "'Cafe24Anemone', sans-serif"
          }}>
            🔐 관리자 로그인
          </h1>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
            통계 대시보드 접근을 위해 비밀번호를 입력하세요
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '24px',
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: '4px',
            color: '#cf1322',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#cf1322',
                padding: '0 4px'
              }}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              autoFocus
              required
              minLength={6}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d9d9d9';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || password.length < 6}
            style={{
              width: '100%',
              height: '48px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              background: loading ? '#d9d9d9' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.3s',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#999'
        }}>
          <p style={{ margin: 0 }}>
            이 페이지는 관리자 전용입니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(AdminLoginPage), { ssr: false });
