import React from 'react'
import Link from 'next/link'

interface PageFooterProps {
  isMobile?: boolean
}

const PageFooter: React.FC<PageFooterProps> = ({ isMobile = false }) => {
  return (
    <footer style={{
      width: '100%',
      padding: '16px',
      textAlign: 'center',
      borderTop: '1px solid #eaeaea',
      marginTop: '32px',
      color: '#666',
      fontSize: isMobile ? '12px' : '14px',
      backgroundColor: '#f9f9f9',
      fontFamily: "'Inter', 'Roboto', 'Helvetica Neue', sans-serif"
    }}>
      <div style={{ marginBottom: '12px' }}>
        <Link href="/privacy" style={{ color: '#666', textDecoration: 'none', padding: '0 8px' }}>
          개인정보 처리방침
        </Link>
        <span style={{ color: '#ddd' }}>|</span>
        <Link href="/terms" style={{ color: '#666', textDecoration: 'none', padding: '0 8px' }}>
          이용약관
        </Link>
        <span style={{ color: '#ddd' }}>|</span>
        <Link href="/about" style={{ color: '#666', textDecoration: 'none', padding: '0 8px' }}>
          소개
        </Link>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <a
          href="https://gqai.kr"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#1a4b8c',
            textDecoration: 'none',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}
        >
          GQAI.kr
        </a>
      </div>
      <div>
        <a href="mailto:gq.newslens@gmail.com" style={{
          color: '#1a4b8c',
          textDecoration: 'none',
          fontWeight: '500'
        }}>
          gq.newslens@gmail.com
        </a>
      </div>
    </footer>
  )
}

export default PageFooter
