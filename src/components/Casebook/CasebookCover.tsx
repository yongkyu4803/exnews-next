import React from 'react'

interface CasebookCoverProps {
  title: string
  subtitle?: string
  date?: string
  width?: number
  height?: number
}

const CasebookCover: React.FC<CasebookCoverProps> = ({
  title,
  subtitle,
  date,
  width = 300,
  height = 200,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 300 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: 8 }}
    >
      {/* 배경 그라데이션 */}
      <defs>
        <linearGradient id="coverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1e40af', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
        </linearGradient>

        {/* 책 질감 패턴 */}
        <pattern id="bookTexture" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="rgba(255,255,255,0.03)" />
          <path d="M 0 0 L 4 4 M 4 0 L 0 4" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        </pattern>

        {/* 그림자 필터 */}
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="2" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 메인 책 표지 */}
      <rect width="300" height="200" fill="url(#coverGradient)" />
      <rect width="300" height="200" fill="url(#bookTexture)" />

      {/* 왼쪽 책등 효과 */}
      <rect x="0" y="0" width="15" height="200" fill="rgba(0,0,0,0.2)" />
      <rect x="15" y="0" width="2" height="200" fill="rgba(255,255,255,0.1)" />

      {/* 상단 장식 라인 */}
      <line x1="30" y1="30" x2="270" y2="30" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <line x1="30" y1="33" x2="270" y2="33" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />

      {/* 책 아이콘 */}
      <g transform="translate(35, 50)">
        <rect x="0" y="0" width="30" height="40" fill="rgba(255,255,255,0.2)" rx="2" />
        <rect x="3" y="3" width="24" height="34" fill="rgba(255,255,255,0.1)" rx="1" />
        <line x1="8" y1="10" x2="22" y2="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        <line x1="8" y1="16" x2="22" y2="16" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        <line x1="8" y1="22" x2="18" y2="22" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
      </g>

      {/* 제목 */}
      <text
        x="150"
        y="90"
        textAnchor="middle"
        fill="white"
        fontSize="18"
        fontWeight="700"
        fontFamily="sans-serif"
      >
        {(() => {
          if (title.length <= 20) {
            return <tspan x="150" dy="0">{title}</tspan>
          }
          // 두 줄로 분할
          const midPoint = title.length / 2
          const spaceIndex = title.lastIndexOf(' ', midPoint)
          const breakPoint = spaceIndex > 0 ? spaceIndex : Math.min(20, title.length)

          const line1 = title.substring(0, breakPoint).trim()
          const line2 = title.substring(breakPoint).trim()

          return (
            <>
              <tspan x="150" dy="0">{line1.length > 22 ? line1.substring(0, 22) + '...' : line1}</tspan>
              <tspan x="150" dy="22">{line2.length > 22 ? line2.substring(0, 22) + '...' : line2}</tspan>
            </>
          )
        })()}
      </text>

      {/* 부제목 */}
      {subtitle && (
        <text
          x="150"
          y="135"
          textAnchor="middle"
          fill="rgba(255,255,255,0.8)"
          fontSize="12"
          fontWeight="400"
          fontFamily="sans-serif"
        >
          {subtitle}
        </text>
      )}

      {/* 날짜 */}
      {date && (
        <text
          x="150"
          y="152"
          textAnchor="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize="11"
          fontWeight="300"
          fontFamily="sans-serif"
        >
          {date}
        </text>
      )}

      {/* 하단 장식 라인 */}
      <line x1="30" y1="170" x2="270" y2="170" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
      <line x1="30" y1="173" x2="270" y2="173" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

      {/* 오른쪽 하단 로고 영역 */}
      <g transform="translate(240, 160)">
        <text
          x="0"
          y="0"
          textAnchor="start"
          fill="rgba(255,255,255,0.5)"
          fontSize="10"
          fontWeight="600"
          fontFamily="sans-serif"
        >
          CASEBOOK
        </text>
      </g>

      {/* 책 테두리 */}
      <rect
        x="0.5"
        y="0.5"
        width="299"
        height="199"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
    </svg>
  )
}

export default CasebookCover
