# GQAI 웹 대시보드

## 🎯 개요

GQAI 브랜드의 정책 인텔리전스 플랫폼 대시보드입니다. CODIT 스타일을 참고하되 완전히 독창적인 GQAI만의 디자인과 기능을 구현했습니다.

## 🎨 디자인 시스템

### 브랜드 색상
- **Primary**: `#1a4b8c` (딥 블루 - 신뢰감, 전문성)
- **Secondary**: `#2d5aa0` (라이트 블루)
- **Accent**: `#ff6b35` (코랄 오렌지 - 에너지, 혁신)
- **Success**: `#06d6a0` (민트 그린)

### 타이포그래피
- **헤더**: Montserrat (영문) + Pretendard (한글)
- **본문**: Inter (영문) + Pretendard (한글)

## 📐 레이아웃 구조

### Desktop (1200px+)
```
┌──────────────────────────────────────────┐
│            헤더 (고정)                    │
├────────┬────────────────┬─────────────────┤
│  좌측  │   중앙 메인     │     우측        │
│ (25%)  │    (50%)       │    (25%)       │
└────────┴────────────────┴─────────────────┘
```

### Tablet (768px-1199px)
- 2단 레이아웃 (좌측 35% + 우측 65%)
- 우측 패널은 하단으로 이동

### Mobile (< 768px)
- 1단 세로 레이아웃
- 통계 → 뉴스 피드 → 인사이트 순서

## 📂 파일 구조

```
src/
├── pages/
│   └── dashboard.tsx                    # 메인 대시보드 페이지
│
├── components/
│   └── Dashboard/
│       ├── Layout/
│       │   ├── DashboardLayout.tsx      # 3단 레이아웃 컨테이너
│       │   └── DashboardHeader.tsx      # 헤더 (로고, 네비, 검색)
│       │
│       └── Widgets/
│           ├── StatsCard.tsx            # 통계 카드
│           └── CategoryFilter.tsx       # 카테고리 필터
│
└── styles/
    └── dashboard/
        ├── theme.module.css             # GQAI 테마 (CSS 변수)
        ├── layout.module.css            # 레이아웃 스타일
        └── animations.module.css        # 애니메이션
```

## 🚀 접근 방법

### 로컬 개발
```bash
npm run dev
# http://localhost:3000/dashboard
```

### 프로덕션
```bash
npm run build
npm run start
# https://yourdomain.com/dashboard
```

## 🧩 주요 기능

### 1. 좌측 패널
- **실시간 통계 카드** (4개)
  - 단독 뉴스 (파일 아이콘)
  - 랭킹 뉴스 (불꽃 아이콘)
  - 사설 분석 (문서 아이콘)
  - 법안 모니터링 (차트 아이콘)

- **카테고리 필터**
  - 전체 / 정치 / 경제 / 사회 / 국제 / 문화 / 연예스포츠 / 기타
  - 클릭 시 중앙 패널 뉴스 필터링

### 2. 중앙 메인 패널
- **최신 뉴스 피드**
  - 카테고리 배지 + 출처 + 시간
  - 제목 + 요약 (2줄)
  - 클릭 시 원문 링크 오픈
  - 20개 항목 표시

- **인터랙션**
  - 호버 시 테두리 색상 변경
  - 호버 시 그림자 효과

### 3. 우측 패널
- **GQAI 인사이트** (준비 중)
  - AI 기반 정책 트렌드 분석

- **트렌딩 토픽** (준비 중)
  - 실시간 인기 뉴스

## 📊 데이터 흐름

1. **통계 집계**
   ```typescript
   /api/news → totalCount
   /api/ranking-news → totalCount
   /api/editorials → totalCount
   /api/bills → totalCount
   ```

2. **뉴스 피드**
   ```typescript
   /api/news?page=1&pageSize=20&category={선택된카테고리}
   ```

3. **자동 갱신**
   - 통계: 2분마다
   - 뉴스: 1분마다 (staleTime)

## 🎯 확장 가능성

### 단기 확장 (1-2주)
- [ ] 검색 기능 구현
- [ ] 탭 전환 (단독/랭킹/사설/정치/법안)
- [ ] 무한 스크롤
- [ ] 북마크 기능

### 중기 확장 (1-2개월)
- [ ] 실시간 알림 (WebSocket)
- [ ] 차트/그래프 (Recharts)
- [ ] 다크 모드
- [ ] AI 요약 (GPT API)

### 장기 확장 (3-6개월)
- [ ] 데이터 시각화 대시보드
- [ ] PDF 리포트 생성
- [ ] 모바일 앱
- [ ] 다국어 지원

## 🔧 커스터마이징

### 색상 변경
```css
/* src/styles/dashboard/theme.module.css */
:root {
  --gqai-primary: #1a4b8c;  /* 여기를 변경 */
  --gqai-accent: #ff6b35;   /* 여기를 변경 */
}
```

### 레이아웃 비율 조정
```css
/* src/styles/dashboard/layout.module.css */
.dashboardMain {
  grid-template-columns: 300px 1fr 320px;
  /* 좌측 중앙 우측 비율 조정 */
}
```

### 위젯 추가
```typescript
// src/pages/dashboard.tsx
const leftPanel = (
  <>
    <StatsCard ... />
    <YourNewWidget />  {/* 새 위젯 추가 */}
  </>
);
```

## 📱 반응형 테스트

### 데스크톱 (1200px+)
- Chrome DevTools에서 1600px 너비로 테스트
- 3단 레이아웃 확인

### 태블릿 (768px-1199px)
- iPad (1024px) 테스트
- 2단 레이아웃 확인

### 모바일 (< 768px)
- iPhone (375px, 414px) 테스트
- 1단 세로 레이아웃 확인

## 🐛 알려진 이슈

현재 알려진 이슈는 없습니다.

## 📞 문의

프로젝트 관련 문의: gq.newslens@gmail.com
