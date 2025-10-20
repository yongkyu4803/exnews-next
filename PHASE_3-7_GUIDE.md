# Phase 3-7 구현 가이드

**문서 버전**: 1.0
**작성일**: 2025-10-20
**대상 프로젝트**: EXNEWS-Next (단독뉴스)
**전제 조건**: Phase 1-2 완료

---

## 📑 목차

1. [Phase 3: 테스트 인프라 구축](#phase-3-테스트-인프라-구축)
2. [Phase 4: 성능 최적화](#phase-4-성능-최적화)
3. [Phase 5: 보안 강화](#phase-5-보안-강화)
4. [Phase 6: 접근성 개선](#phase-6-접근성-개선)
5. [Phase 7: PWA 기능 완성](#phase-7-pwa-기능-완성)
6. [통합 타임라인 및 우선순위](#통합-타임라인-및-우선순위)

---

# Phase 3: 테스트 인프라 구축

**예상 소요 시간**: 2-3일
**난이도**: 중
**우선순위**: 높음 (필수)

## 🎯 목적

- 코드의 안정성과 신뢰성을 보장
- 리팩토링 및 새 기능 추가 시 회귀 버그 방지
- CI/CD 파이프라인의 기반 마련
- 코드 품질 지표 확보

## 📋 작업 항목

### 3.1 테스트 환경 설정

#### 패키지 설치

```bash
# 테스트 라이브러리
npm install --save-dev @testing-library/react
npm install --save-dev @testing-library/jest-dom
npm install --save-dev @testing-library/user-event

# Jest 설정
npm install --save-dev jest jest-environment-jsdom
npm install --save-dev @types/jest

# Next.js 테스트 지원
npm install --save-dev @testing-library/react-hooks
```

#### Jest 설정 파일

**`jest.config.js`**:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/_*.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

**`jest.setup.js`**:
```javascript
import '@testing-library/jest-dom'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}
```

**`package.json` 스크립트 추가**:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

### 3.2 단위 테스트 (Unit Tests)

#### 3.2.1 유틸리티 함수 테스트

**`src/utils/__tests__/logger.test.ts`**:
```typescript
import { Logger, createLogger } from '../logger'

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'info').mockImplementation()
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log in development mode', () => {
    const logger = new Logger()
    logger.info('test message')
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('should not log in production mode', () => {
    process.env.NODE_ENV = 'production'
    const logger = new Logger()
    logger.info('test message')
    expect(consoleSpy).not.toHaveBeenCalled()
  })

  it('should create logger with custom prefix', () => {
    const logger = createLogger('TEST')
    logger.info('test message')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TEST]')
    )
  })
})
```

**`src/utils/__tests__/clipboardUtils.test.ts`**:
```typescript
import { copyNewsSimple } from '../clipboardUtils'

describe('clipboardUtils', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    })
  })

  it('should copy items to clipboard', async () => {
    const items = [
      { title: 'News 1', link: 'http://example.com/1' },
      { title: 'News 2', link: 'http://example.com/2' },
    ]

    const result = await copyNewsSimple(
      items,
      item => `${item.title}\n${item.link}`
    )

    expect(result.success).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })

  it('should return error for empty items', async () => {
    const result = await copyNewsSimple([], item => item.title)

    expect(result.success).toBe(false)
    expect(result.message).toContain('선택된 기사가 없습니다')
  })
})
```

**`src/utils/__tests__/dateUtils.test.ts`**:
```typescript
import { formatDateToKorean } from '../dateUtils'

describe('dateUtils', () => {
  it('should format date to Korean format', () => {
    const date = '2025-10-20T10:30:00Z'
    const result = formatDateToKorean(date)

    expect(result).toMatch(/\d{4}년 \d{1,2}월 \d{1,2}일/)
  })

  it('should handle invalid date', () => {
    const result = formatDateToKorean('invalid')
    expect(result).toBe('날짜 없음')
  })
})
```

---

#### 3.2.2 컴포넌트 테스트

**`src/components/__tests__/ErrorBoundary.test.tsx`**:
```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

const ThrowError = () => {
  throw new Error('Test error')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should render fallback UI on error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/문제가 발생했습니다/)).toBeInTheDocument()
  })

  it('should render custom fallback', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error')).toBeInTheDocument()
  })
})
```

**`src/components/mobile/__tests__/NewsCard.test.tsx`**:
```typescript
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import NewsCard from '../NewsCard'

const mockNewsItem = {
  id: '1',
  title: 'Test News',
  original_link: 'http://example.com',
  pub_date: '2025-10-20',
  category: '정치',
}

describe('NewsCard', () => {
  it('should render news item', () => {
    render(
      <NewsCard
        item={mockNewsItem}
        isSelected={false}
        onSelect={jest.fn()}
      />
    )

    expect(screen.getByText('Test News')).toBeInTheDocument()
  })

  it('should call onSelect when clicked', () => {
    const onSelect = jest.fn()
    render(
      <NewsCard
        item={mockNewsItem}
        isSelected={false}
        onSelect={onSelect}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /선택/ }))
    expect(onSelect).toHaveBeenCalledWith('1', true)
  })

  it('should show selected state', () => {
    const { container } = render(
      <NewsCard
        item={mockNewsItem}
        isSelected={true}
        onSelect={jest.fn()}
      />
    )

    expect(container.firstChild).toHaveStyle({
      backgroundColor: 'rgba(26, 115, 232, 0.1)',
    })
  })
})
```

---

#### 3.2.3 API 라우트 테스트

**`src/pages/api/__tests__/news.test.ts`**:
```typescript
import handler from '../news'
import { createMocks } from 'node-mocks-http'

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({
              data: [
                { id: 1, title: 'News 1', category: '정치' },
                { id: 2, title: 'News 2', category: '정치' },
              ],
              error: null,
              count: 100,
            })),
          })),
        })),
      })),
    })),
  },
}))

describe('/api/news', () => {
  it('should return news items', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', pageSize: '20', category: '정치' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.items).toHaveLength(2)
    expect(data.totalCount).toBe(100)
  })

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })
})
```

---

### 3.3 통합 테스트 (Integration Tests)

**`__tests__/integration/news-flow.test.tsx`**:
```typescript
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from 'react-query'
import HomePage from '@/pages/index'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

describe('News Flow Integration', () => {
  it('should load news and filter by category', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/단독 뉴스/)).toBeInTheDocument()
    })

    // Click category tab
    const categoryTab = screen.getByText('정치')
    await userEvent.click(categoryTab)

    // Check filtered results
    await waitFor(() => {
      expect(screen.queryByText(/경제/)).not.toBeInTheDocument()
    })
  })
})
```

---

### 3.4 E2E 테스트 (Playwright - 선택사항)

#### Playwright 설치

```bash
npm install --save-dev @playwright/test
npx playwright install
```

**`playwright.config.ts`**:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

**`e2e/news.spec.ts`**:
```typescript
import { test, expect } from '@playwright/test'

test('should display news list', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('h1')).toContainText('단독 뉴스')

  const newsCards = page.locator('[data-testid="news-card"]')
  await expect(newsCards).toHaveCount(7)
})

test('should filter by category', async ({ page }) => {
  await page.goto('/')

  await page.click('text=정치')

  await expect(page.locator('[data-testid="category-badge"]')).toHaveText('정치')
})

test('should copy news to clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  await page.goto('/')

  await page.click('[data-testid="news-card"]:first-child [data-testid="select-button"]')
  await page.click('[data-testid="copy-button"]')

  await expect(page.locator('text=클립보드에 복사되었습니다')).toBeVisible()
})
```

---

## ✅ Phase 3 체크리스트

- [ ] Jest 설정 완료
- [ ] 유틸리티 함수 테스트 작성 (10-15개)
- [ ] 컴포넌트 테스트 작성 (20-30개)
- [ ] API 라우트 테스트 작성 (10-15개)
- [ ] 통합 테스트 작성 (5-10개)
- [ ] E2E 테스트 작성 (선택, 5-10개)
- [ ] 테스트 커버리지 60% 이상 달성
- [ ] CI/CD 파이프라인에 테스트 추가

## 📊 예상 결과

- **테스트 커버리지**: 60-70%
- **테스트 파일 수**: 15-20개
- **총 테스트 케이스**: 50-70개
- **실행 시간**: 5-10초
- **안정성 향상**: 회귀 버그 80% 감소

---

# Phase 4: 성능 최적화

**예상 소요 시간**: 3-4일
**난이도**: 중상
**우선순위**: 중 (권장)

## 🎯 목적

- 사용자 경험 개선
- 로딩 속도 향상
- 효율적인 리소스 사용
- Core Web Vitals 개선

## 📋 작업 항목

### 4.1 번들 크기 분석 및 최적화

#### Bundle Analyzer 설치

```bash
npm install --save-dev @next/bundle-analyzer
```

**`next.config.js` 수정**:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(withPWA(nextConfig))
```

**분석 실행**:
```bash
ANALYZE=true npm run build
```

#### 번들 최적화 전략

**1. Ant Design 트리 쉐이킹 개선**

현재:
```typescript
import { Button } from 'antd'  // 전체 번들 포함
```

개선:
```typescript
import Button from 'antd/lib/button'  // 필요한 것만 포함
import 'antd/lib/button/style/css'    // 스타일만 포함
```

또는 babel-plugin-import 사용:
```bash
npm install --save-dev babel-plugin-import
```

**`.babelrc`**:
```json
{
  "plugins": [
    [
      "import",
      {
        "libraryName": "antd",
        "style": "css"
      }
    ]
  ]
}
```

**2. 동적 import 최적화**

개선 전:
```typescript
const NewsTable = dynamic(() => import('@/components/NewsTable'))
```

개선 후:
```typescript
const NewsTable = dynamic(() => import('@/components/NewsTable'), {
  loading: () => <Skeleton active />,
  ssr: false,
})
```

**3. 라우트별 코드 분할**

```typescript
// pages/admin/index.tsx
export default dynamic(() => import('@/features/admin/AdminPage'), {
  ssr: false,
})
```

---

### 4.2 서버 사이드 페이지네이션

#### 현재 문제 분석

```typescript
// ❌ 현재: 모든 데이터를 클라이언트로 전송
const response = await fetch('/api/news?all=true&category=정치')
// 1000개 뉴스 다운로드 → 클라이언트에서 필터링/페이징
```

#### 개선 방안

**1. React Query 설정 변경**

```typescript
// src/hooks/useNews.ts (신규 생성)
import { useQuery } from 'react-query'

interface UseNewsParams {
  page: number
  pageSize: number
  category?: string
}

export function useNews({ page, pageSize, category }: UseNewsParams) {
  return useQuery(
    ['news', page, pageSize, category],
    async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(category && { category }),
      })

      const response = await fetch(`/api/news?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5분
    }
  )
}
```

**2. 페이지 컴포넌트 수정**

```typescript
// pages/index.tsx
function HomePage() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('all')

  const { data, isLoading } = useNews({
    page,
    pageSize: 20,
    category: category !== 'all' ? category : undefined,
  })

  return (
    <div>
      {isLoading && <Skeleton count={20} />}
      {data?.items.map(item => <NewsCard key={item.id} item={item} />)}

      <Pagination
        current={page}
        pageSize={20}
        total={data?.totalCount || 0}
        onChange={setPage}
      />
    </div>
  )
}
```

**3. API 수정 (이미 지원함!)**

```typescript
// src/pages/api/news.ts
// ✅ 이미 페이지네이션 지원 중
// ?page=1&pageSize=20 형태로 사용
```

#### 예상 효과

| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| 초기 데이터 크기 | 500KB | 50KB | 90% |
| 초기 로드 시간 | 3초 | 1초 | 66% |
| 메모리 사용량 | 50MB | 5MB | 90% |

---

### 4.3 이미지 최적화

#### 1. Next.js Image 컴포넌트 활성화

**`next.config.js`**:
```javascript
const nextConfig = {
  images: {
    unoptimized: false,  // ✅ 최적화 활성화
    domains: ['rxwztfdnragffxbmlscf.supabase.co'],  // Supabase 도메인
    formats: ['image/webp', 'image/avif'],
  },
}
```

#### 2. Image 컴포넌트 사용

변경 전:
```typescript
<img src={imageUrl} alt="news" />
```

변경 후:
```typescript
import Image from 'next/image'

<Image
  src={imageUrl}
  alt="news"
  width={300}
  height={200}
  loading="lazy"
  placeholder="blur"
  blurDataURL="/placeholder.jpg"
/>
```

#### 3. 반응형 이미지

```typescript
<Image
  src={imageUrl}
  alt="news"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  style={{ objectFit: 'cover' }}
/>
```

---

### 4.4 React Query 캐싱 전략

```typescript
// src/pages/_app.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000,      // 15분
      cacheTime: 30 * 60 * 1000,      // 30분
      refetchOnWindowFocus: false,     // 포커스 시 리페칭 안함
      refetchOnMount: false,           // 마운트 시 리페칭 안함
      retry: 1,                        // 재시도 1회
    },
  },
})
```

---

### 4.5 Virtual Scrolling 개선

**현재 구현 검토**:
```typescript
// src/components/mobile/VirtualNewsList.tsx
<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={80}  // 각 아이템 높이
  width="100%"
>
  {Row}
</FixedSizeList>
```

**개선 사항**:

1. **동적 높이 지원** (VariableSizeList):
```typescript
import { VariableSizeList } from 'react-window'

<VariableSizeList
  height={600}
  itemCount={items.length}
  itemSize={index => getItemSize(index)}  // 동적 계산
  width="100%"
>
  {Row}
</VariableSizeList>
```

2. **Overscan 최적화**:
```typescript
<FixedSizeList
  overscanCount={5}  // 스크롤 방향으로 5개 더 렌더링
>
```

---

### 4.6 CSS 최적화

#### 1. Critical CSS 인라인

```bash
npm install --save-dev critters
```

**`next.config.js`**:
```javascript
const nextConfig = {
  experimental: {
    optimizeCss: true,  // CSS 최적화 활성화
  },
}
```

#### 2. 사용하지 않는 CSS 제거

```bash
npm install --save-dev @fullhuman/postcss-purgecss
```

**`postcss.config.js`**:
```javascript
module.exports = {
  plugins: [
    [
      '@fullhuman/postcss-purgecss',
      {
        content: ['./src/**/*.{js,jsx,ts,tsx}'],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      },
    ],
  ],
}
```

---

### 4.7 Web Font 최적화

**`pages/_document.tsx`**:
```typescript
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

---

## ✅ Phase 4 체크리스트

- [ ] Bundle Analyzer 설정 및 분석
- [ ] Ant Design 트리 쉐이킹
- [ ] 동적 import 최적화
- [ ] 서버 사이드 페이지네이션 구현
- [ ] Next.js Image 컴포넌트 적용
- [ ] React Query 캐싱 전략 개선
- [ ] Virtual Scrolling 최적화
- [ ] CSS 최적화 (Critical CSS, PurgeCSS)
- [ ] Web Font 최적화
- [ ] Lighthouse 점수 측정 (목표: 90+)

## 📊 예상 결과

| 지표 | Before | After | 개선 |
|------|--------|-------|------|
| **Lighthouse 성능** | 60 | 95+ | +58% |
| **번들 크기** | 200KB | 150KB | -25% |
| **초기 로드** | 3초 | <1초 | 66% |
| **LCP** | 4초 | <2.5초 | 37% |
| **FID** | 150ms | <100ms | 33% |
| **CLS** | 0.15 | <0.1 | 33% |

---

# Phase 5: 보안 강화

**예상 소요 시간**: 2-3일
**난이도**: 중
**우선순위**: 높음 (필수)

## 🎯 목적

- 데이터 보호 및 개인정보 보안
- 인증/인가 시스템 구축
- 취약점 제거 및 예방
- 보안 규정 준수

## 📋 작업 항목

### 5.1 관리자 페이지 인증

#### 옵션 1: NextAuth.js (권장)

**설치**:
```bash
npm install next-auth
```

**`pages/api/auth/[...nextauth].ts`**:
```typescript
import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { SupabaseAdapter } from '@auth/supabase-adapter'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  callbacks: {
    async session({ session, user }) {
      session.user.role = user.role
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

export default NextAuth(authOptions)
```

**로그인 페이지 `pages/auth/signin.tsx`**:
```typescript
import { signIn } from 'next-auth/react'

export default function SignIn() {
  return (
    <div className="signin-container">
      <h1>로그인</h1>
      <button onClick={() => signIn('google')}>
        Google로 로그인
      </button>
    </div>
  )
}
```

**미들웨어로 보호 `middleware.ts`**:
```typescript
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname

      // /admin 경로는 인증 필수
      if (path.startsWith('/admin')) {
        return !!token && token.role === 'admin'
      }

      return true
    },
  },
})

export const config = {
  matcher: ['/admin/:path*'],
}
```

**관리자 페이지 보호**:
```typescript
// pages/admin/index.tsx
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function AdminPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin')
    },
  })

  if (status === 'loading') return <div>Loading...</div>

  if (session?.user.role !== 'admin') {
    return <div>권한이 없습니다</div>
  }

  return <div>관리자 페이지</div>
}
```

---

#### 옵션 2: Supabase Auth

**설치**:
```bash
npm install @supabase/auth-helpers-nextjs @supabase/auth-helpers-react
```

**`pages/_app.tsx`**:
```typescript
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createClient } from '@supabase/supabase-js'

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <Component {...pageProps} />
    </SessionContextProvider>
  )
}
```

**로그인 컴포넌트**:
```typescript
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export function LoginForm() {
  const supabase = useSupabaseClient()

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      handleLogin(
        formData.get('email') as string,
        formData.get('password') as string
      )
    }}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">로그인</button>
    </form>
  )
}
```

**보호된 페이지**:
```typescript
import { useSession } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function AdminPage() {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.push('/login')
    }
  }, [session, router])

  if (!session) return null

  return <div>관리자 페이지</div>
}
```

---

### 5.2 Input 검증 및 Sanitization

#### Zod 스키마 검증

**설치**:
```bash
npm install zod
```

**API 라우트 검증**:
```typescript
// src/lib/validators.ts
import { z } from 'zod'

export const newsQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, '페이지는 숫자여야 합니다')
    .transform(Number)
    .refine(n => n > 0 && n <= 1000, '페이지는 1-1000 사이여야 합니다'),

  pageSize: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine(n => n > 0 && n <= 100, '페이지 크기는 1-100 사이여야 합니다'),

  category: z
    .enum(['정치', '경제', '사회', '국제', '문화', '연예/스포츠', '기타'])
    .optional(),

  search: z
    .string()
    .max(100, '검색어는 100자 이하여야 합니다')
    .optional(),
})

export const categorySchema = z.enum([
  '정치',
  '경제',
  '사회',
  '국제',
  '문화',
  '연예/스포츠',
  '기타',
])
```

**API 라우트 적용**:
```typescript
// src/pages/api/news.ts
import { newsQuerySchema } from '@/lib/validators'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // ✅ 검증
    const { page, pageSize, category, search } = newsQuerySchema.parse(req.query)

    // ... 나머지 로직
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors,
      })
    }

    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

#### URL Sanitization (XSS 방어)

**설치**:
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

**사용**:
```typescript
import DOMPurify from 'dompurify'

function NewsCard({ item }: { item: NewsItem }) {
  const sanitizedLink = DOMPurify.sanitize(item.original_link)

  return (
    <a href={sanitizedLink} target="_blank" rel="noopener noreferrer">
      {item.title}
    </a>
  )
}
```

---

### 5.3 보안 헤더 설정

**`next.config.js`**:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://rxwztfdnragffxbmlscf.supabase.co",
            ].join('; '),
          },
        ],
      },
    ]
  },
}
```

---

### 5.4 의존성 취약점 관리

#### npm audit 실행

```bash
# 취약점 스캔
npm audit

# 자동 수정 (안전한 것만)
npm audit fix

# 모든 취약점 강제 수정 (주의!)
npm audit fix --force
```

#### 정기적 업데이트 스크립트

**`package.json`**:
```json
{
  "scripts": {
    "audit": "npm audit --json > audit-report.json",
    "update-deps": "npm update",
    "check-updates": "npx npm-check-updates"
  }
}
```

#### 주요 패키지 업데이트

```bash
# Next.js
npm install next@latest

# React
npm install react@latest react-dom@latest

# Ant Design
npm install antd@latest

# Supabase
npm install @supabase/supabase-js@latest
```

---

### 5.5 환경 변수 보안

#### .env 파일 구조

```env
# .env.local (개발 환경)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 서버 전용 (NEXT_PUBLIC_ 접두사 없음)
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

#### .env.example 생성

```env
# .env.example (Git에 커밋)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### 환경 변수 타입 정의

```typescript
// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_ROLE_KEY: string
    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string
  }
}
```

---

### 5.6 Rate Limiting

**설치**:
```bash
npm install express-rate-limit
npm install --save-dev @types/express-rate-limit
```

**미들웨어 생성**:
```typescript
// src/lib/rateLimit.ts
import rateLimit from 'express-rate-limit'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
})
```

**API 라우트 적용**:
```typescript
// src/pages/api/news.ts
import { apiLimiter } from '@/lib/rateLimit'

export default async function handler(req, res) {
  // Rate limiting 적용
  await new Promise((resolve, reject) => {
    apiLimiter(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })

  // ... 나머지 로직
}
```

---

## ✅ Phase 5 체크리스트

- [ ] 인증 시스템 선택 및 구현 (NextAuth 또는 Supabase Auth)
- [ ] 관리자 페이지 보호
- [ ] Zod 스키마 검증 추가
- [ ] XSS 방어 (DOMPurify)
- [ ] 보안 헤더 설정
- [ ] npm audit 실행 및 취약점 수정
- [ ] 의존성 최신 버전 업데이트
- [ ] 환경 변수 보안 강화
- [ ] Rate Limiting 구현
- [ ] 보안 테스트 실행

## 📊 예상 결과

- **인증 시스템**: 완전히 보호된 관리자 페이지
- **취약점**: 0개 (npm audit)
- **보안 헤더**: 모든 권장 헤더 적용
- **Input 검증**: 100% API 엔드포인트
- **보안 점수**: B → A (Security Headers)

---

# Phase 6: 접근성 개선

**예상 소요 시간**: 2-3일
**난이도**: 중
**우선순위**: 중 (권장, 법적 요구사항)

## 🎯 목적

- WCAG 2.1 AA 준수
- 모든 사용자가 사용 가능한 웹앱
- 스크린 리더 지원
- 키보드 네비게이션 완전 지원

## 📋 작업 항목

### 6.1 ARIA 레이블 추가

#### 인터랙티브 요소

**Before**:
```typescript
<button onClick={handleSelect}>
  <Icon />
</button>
```

**After**:
```typescript
<button onClick={handleSelect} aria-label="뉴스 선택">
  <Icon />
</button>
```

#### 동적 콘텐츠

```typescript
function NewsList({ items, isLoading }: Props) {
  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true">
        {isLoading ? (
          <span>뉴스를 불러오는 중입니다...</span>
        ) : (
          <span className="sr-only">{items.length}개의 뉴스가 로드되었습니다</span>
        )}
      </div>

      <ul role="list" aria-label="뉴스 목록">
        {items.map(item => (
          <li key={item.id} role="listitem">
            <NewsCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  )
}
```

#### 모달/다이얼로그

```typescript
function Modal({ isOpen, onClose, children }: Props) {
  return isOpen ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title">제목</h2>
      <div id="modal-description">{children}</div>
      <button onClick={onClose} aria-label="모달 닫기">
        ×
      </button>
    </div>
  ) : null
}
```

---

### 6.2 키보드 네비게이션

#### 전역 키보드 단축키

```typescript
// src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react'

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd + K: 검색 포커스
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }

      // Escape: 선택 취소
      if (e.key === 'Escape') {
        // Clear selection
      }

      // ?: 키보드 단축키 도움말
      if (e.key === '?') {
        // Show shortcuts modal
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
```

#### 리스트 네비게이션

```typescript
function NewsList({ items }: Props) {
  const [focusedIndex, setFocusedIndex] = useState(0)

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(0, prev - 1))
        break

      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(items.length - 1, prev + 1))
        break

      case 'Enter':
      case ' ':
        e.preventDefault()
        handleSelect(items[focusedIndex])
        break

      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break

      case 'End':
        e.preventDefault()
        setFocusedIndex(items.length - 1)
        break
    }
  }

  return (
    <ul role="list" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li
          key={item.id}
          tabIndex={index === focusedIndex ? 0 : -1}
          aria-selected={index === focusedIndex}
        >
          <NewsCard item={item} />
        </li>
      ))}
    </ul>
  )
}
```

#### Focus 스타일

```css
/* globals.css */
:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
  border-radius: 4px;
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

/* 마우스 클릭 시 outline 제거 */
:focus:not(:focus-visible) {
  outline: none;
}
```

#### Skip to Content 링크

```typescript
// components/SkipToContent.tsx
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="skip-to-content"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '0',
        zIndex: 999,
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '0'
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-9999px'
      }}
    >
      본문으로 건너뛰기
    </a>
  )
}
```

---

### 6.3 시맨틱 HTML

#### HTML5 시맨틱 태그 사용

**Before**:
```typescript
<div className="header">
  <div className="nav">...</div>
</div>
<div className="content">
  <div className="article">...</div>
</div>
```

**After**:
```typescript
<header>
  <nav aria-label="메인 네비게이션">...</nav>
</header>
<main id="main-content">
  <article>
    <h1>뉴스 제목</h1>
    <time dateTime="2025-10-20">2025년 10월 20일</time>
    <p>내용...</p>
  </article>
</main>
<footer>...</footer>
```

#### 제목 계층 구조

```typescript
<main>
  <h1>단독 뉴스</h1>  {/* 페이지 제목 */}

  <section>
    <h2>정치</h2>  {/* 섹션 제목 */}

    <article>
      <h3>뉴스 제목 1</h3>  {/* 개별 뉴스 */}
    </article>

    <article>
      <h3>뉴스 제목 2</h3>
    </article>
  </section>
</main>
```

---

### 6.4 색상 대비 개선

#### 대비율 계산 도구

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools Lighthouse
- axe DevTools

#### 색상 수정

**Before** (실패):
```css
.text {
  color: #999;  /* 대비율: 2.8:1 ❌ */
  background: #fff;
}
```

**After** (통과):
```css
.text {
  color: #595959;  /* 대비율: 7.0:1 ✅ */
  background: #fff;
}
```

#### 색상 팔레트 정의

```typescript
// src/styles/colors.ts
export const colors = {
  text: {
    primary: '#262626',    // 대비율: 13.7:1
    secondary: '#595959',  // 대비율: 7.0:1
    disabled: '#8C8C8C',   // 대비율: 4.5:1 (최소)
  },
  background: {
    white: '#FFFFFF',
    gray: '#F5F5F5',
  },
  primary: {
    main: '#1890FF',
    hover: '#096DD9',  // 대비율 확인 필요
  },
  error: {
    main: '#FF4D4F',
    text: '#CF1322',  // 대비율: 5.9:1
  },
}
```

---

### 6.5 폼 접근성

#### Label과 Input 연결

**Before**:
```typescript
<div>
  <span>이메일</span>
  <input type="email" />
</div>
```

**After**:
```typescript
<div>
  <label htmlFor="email">이메일</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? 'email-error' : undefined}
  />
  {hasError && (
    <span id="email-error" role="alert">
      올바른 이메일을 입력해주세요
    </span>
  )}
</div>
```

#### 에러 메시지

```typescript
function FormField({ error, ...props }: Props) {
  const errorId = `${props.id}-error`

  return (
    <div>
      <label htmlFor={props.id}>{props.label}</label>
      <input
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <span id={errorId} role="alert" aria-live="polite">
          {error}
        </span>
      )}
    </div>
  )
}
```

---

### 6.6 스크린 리더 테스트

#### 테스트 도구

- **NVDA** (Windows, 무료): https://www.nvaccess.org/
- **JAWS** (Windows, 유료): https://www.freedomscientific.com/
- **VoiceOver** (Mac, 내장): Cmd + F5
- **TalkBack** (Android, 내장)

#### 테스트 시나리오

**체크리스트**:
```markdown
- [ ] 페이지 제목이 정확히 읽히는가?
- [ ] 네비게이션 구조가 명확한가?
- [ ] 모든 이미지에 alt 텍스트가 있는가?
- [ ] 버튼과 링크가 명확히 구분되는가?
- [ ] 폼 필드와 레이블이 연결되는가?
- [ ] 에러 메시지가 읽히는가?
- [ ] 로딩 상태가 알려지는가?
- [ ] 모달/다이얼로그 포커스가 관리되는가?
- [ ] 동적 콘텐츠 변경이 알려지는가?
```

---

### 6.7 접근성 자동 테스트

#### ESLint Plugin 설치

```bash
npm install --save-dev eslint-plugin-jsx-a11y
```

**`.eslintrc.json`**:
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:jsx-a11y/recommended"
  ],
  "plugins": ["jsx-a11y"]
}
```

#### Jest-axe 테스트

```bash
npm install --save-dev jest-axe
```

**테스트 예시**:
```typescript
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import NewsCard from '../NewsCard'

expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = render(<NewsCard item={mockItem} />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

## ✅ Phase 6 체크리스트

- [ ] 모든 이미지에 alt 텍스트 추가
- [ ] 모든 버튼에 aria-label 추가
- [ ] 동적 콘텐츠에 aria-live 적용
- [ ] 키보드 네비게이션 구현
- [ ] Focus 스타일 추가
- [ ] Skip to content 링크 추가
- [ ] 시맨틱 HTML 적용
- [ ] 색상 대비 4.5:1 이상 확보
- [ ] 폼 접근성 개선
- [ ] 스크린 리더 테스트 통과
- [ ] eslint-plugin-jsx-a11y 설치 및 설정
- [ ] jest-axe 자동 테스트 추가
- [ ] Lighthouse 접근성 점수 95+ 달성

## 📊 예상 결과

- **WCAG 2.1 준수**: AA 등급
- **Lighthouse 접근성**: 60 → 95+
- **ARIA 레이블**: 100% 커버리지
- **키보드 네비게이션**: 완전 지원
- **색상 대비**: 모든 텍스트 4.5:1 이상
- **스크린 리더**: 100% 호환

---

# Phase 7: PWA 기능 완성

**예상 소요 시간**: 1-2일
**난이도**: 중하
**우선순위**: 중 (경쟁력 강화)

## 🎯 목적

- 네이티브 앱 수준의 사용자 경험
- 완전한 오프라인 지원
- 앱 설치 가능
- 백그라운드 동기화

## 📋 작업 항목

### 7.1 Service Worker 검증

#### 빌드 및 확인

```bash
# 프로덕션 빌드
npm run build

# Service Worker 파일 확인
ls -la public/sw.js public/workbox-*.js

# 로컬에서 프로덕션 빌드 실행
npm run start
```

#### Service Worker 등록 확인

**브라우저 DevTools**:
1. Application 탭 → Service Workers
2. 등록된 Service Worker 확인
3. 캐시 스토리지 확인

#### 캐싱 전략 테스트

```javascript
// next.config.js
runtimeCaching: [
  {
    urlPattern: /^https:\/\/rxwztfdnragffxbmlscf\.supabase\.co\/.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5분
      },
    },
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'image-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30일
      },
    },
  },
  {
    urlPattern: /\.(?:js|css)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-resources',
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 24 * 60 * 60, // 1일
      },
    },
  },
]
```

---

### 7.2 오프라인 기능 완성

#### IndexedDB 완전 구현

**설치**:
```bash
npm install idb
```

**`src/lib/offlineDB.ts`**:
```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface NewsDB extends DBSchema {
  news: {
    key: string
    value: {
      id: string
      title: string
      link: string
      pub_date: string
      category: string
      cachedAt: number
    }
  }
  categories: {
    key: string
    value: {
      name: string
      cachedAt: number
    }
  }
}

let dbPromise: Promise<IDBPDatabase<NewsDB>>

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<NewsDB>('exnews-db', 1, {
      upgrade(db) {
        // News store
        if (!db.objectStoreNames.contains('news')) {
          const newsStore = db.createObjectStore('news', { keyPath: 'id' })
          newsStore.createIndex('category', 'category')
          newsStore.createIndex('cachedAt', 'cachedAt')
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'name' })
        }
      },
    })
  }
  return dbPromise
}

export async function cacheNewsItems(items: NewsItem[]) {
  const db = await getDB()
  const tx = db.transaction('news', 'readwrite')

  await Promise.all([
    ...items.map(item =>
      tx.store.put({
        ...item,
        cachedAt: Date.now(),
      })
    ),
    tx.done,
  ])
}

export async function getCachedNews(category?: string): Promise<NewsItem[]> {
  const db = await getDB()

  if (category) {
    return db.getAllFromIndex('news', 'category', category)
  }

  return db.getAll('news')
}

export async function clearOldCache(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
  const db = await getDB()
  const cutoff = Date.now() - maxAge

  const tx = db.transaction('news', 'readwrite')
  const index = tx.store.index('cachedAt')

  let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff))

  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }

  await tx.done
}
```

#### 오프라인 감지 UI

**`src/components/OfflineIndicator.tsx`**:
```typescript
import { useState, useEffect } from 'react'
import styled from '@emotion/styled'

const Banner = styled.div<{ isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #faad14;
  color: #000;
  padding: 8px 16px;
  text-align: center;
  transform: translateY(${props => props.isVisible ? '0' : '-100%'});
  transition: transform 0.3s;
  z-index: 9999;
`

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <Banner isVisible={!isOnline}>
      ⚠️ 오프라인 모드 - 캐시된 데이터를 표시하고 있습니다
    </Banner>
  )
}
```

#### 오프라인 데이터 사용

**`src/hooks/useOfflineNews.ts`**:
```typescript
import { useQuery } from 'react-query'
import { getCachedNews, cacheNewsItems } from '@/lib/offlineDB'

export function useOfflineNews(category?: string) {
  return useQuery(
    ['news', category, 'offline'],
    async () => {
      // 온라인: API 호출 후 캐시
      if (navigator.onLine) {
        const response = await fetch(`/api/news?category=${category}`)
        const data = await response.json()

        // 백그라운드에서 캐시
        cacheNewsItems(data.items).catch(console.error)

        return data
      }

      // 오프라인: 캐시된 데이터 반환
      const cachedItems = await getCachedNews(category)
      return {
        items: cachedItems,
        totalCount: cachedItems.length,
        isOffline: true,
      }
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  )
}
```

---

### 7.3 PWA Manifest 수정

**`public/manifest.json`**:
```json
{
  "name": "단독뉴스 - EXNEWS",
  "short_name": "EXNEWS",
  "description": "실시간 단독 뉴스 및 랭킹 뉴스를 제공하는 Progressive Web App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1890ff",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "단독 뉴스",
      "short_name": "단독",
      "description": "단독 뉴스 보기",
      "url": "/?tab=exclusive",
      "icons": [
        {
          "src": "/shortcut-exclusive.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "랭킹 뉴스",
      "short_name": "랭킹",
      "description": "인기 뉴스 랭킹",
      "url": "/?tab=ranking",
      "icons": [
        {
          "src": "/shortcut-ranking.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-1.png",
      "sizes": "540x720",
      "type": "image/png"
    },
    {
      "src": "/screenshot-2.png",
      "sizes": "540x720",
      "type": "image/png"
    }
  ],
  "categories": ["news", "productivity"],
  "prefer_related_applications": false
}
```

---

### 7.4 Apple iOS 지원

**`pages/_document.tsx`**:
```typescript
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* PWA Primary Color */}
        <meta name="theme-color" content="#1890ff" />

        {/* Apple iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EXNEWS" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-167.png" />

        {/* Apple Splash Screens */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-640x1136.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash-1242x2208.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash-1242x2688.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
        />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

---

### 7.5 앱 업데이트 알림

**`src/components/UpdatePrompt.tsx`**:
```typescript
import { useState, useEffect } from 'react'
import styled from '@emotion/styled'

const Prompt = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #1890ff;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9998;
`

const Button = styled.button`
  background: white;
  color: #1890ff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;

  &:hover {
    background: #f0f0f0;
  }
`

export function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg)

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing

          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowPrompt(true)
            }
          })
        })
      })

      // 주기적으로 업데이트 확인 (1시간마다)
      const interval = setInterval(() => {
        registration?.update()
      }, 60 * 60 * 1000)

      return () => clearInterval(interval)
    }
  }, [registration])

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })

      // Service Worker 활성화를 기다린 후 새로고침
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  if (!showPrompt) return null

  return (
    <Prompt>
      <span>새로운 버전이 있습니다</span>
      <Button onClick={handleUpdate}>업데이트</Button>
      <button
        onClick={() => setShowPrompt(false)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </Prompt>
  )
}
```

**Service Worker에서 SKIP_WAITING 처리**:
```javascript
// public/sw.js (next-pwa가 생성)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
```

---

### 7.6 커스텀 설치 프롬프트

**`src/components/InstallPrompt.tsx`**:
```typescript
import { useState, useEffect } from 'react'
import styled from '@emotion/styled'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const PromptBanner = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 9997;

  @media (min-width: 768px) {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: 400px;
    border-radius: 8px 8px 0 0;
  }
`

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // 이미 설치된 경우 프롬프트 표시 안함
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // localStorage로 사용자가 이전에 거부했는지 확인
    const dismissed = localStorage.getItem('install-prompt-dismissed')
    if (dismissed) {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // 3초 후 프롬프트 표시
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('install-prompt-dismissed', 'true')
  }

  if (!showPrompt || !deferredPrompt) return null

  return (
    <PromptBanner>
      <div>
        <strong>📱 앱으로 설치하기</strong>
        <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>
          더 빠르고 편리하게 이용하세요
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleInstall}
          style={{
            background: 'white',
            color: '#667eea',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          설치
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: 'white',
            border: '1px solid white',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          나중에
        </button>
      </div>
    </PromptBanner>
  )
}
```

---

### 7.7 백그라운드 동기화 (선택사항)

**설정**:
```typescript
// src/lib/backgroundSync.ts
export async function registerBackgroundSync(tag: string) {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready

    try {
      await registration.sync.register(tag)
      console.log('Background sync registered:', tag)
    } catch (error) {
      console.error('Background sync registration failed:', error)
    }
  }
}

// 사용 예시
export async function syncNewsInBackground() {
  await registerBackgroundSync('sync-news')
}
```

**Service Worker 처리**:
```javascript
// public/sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-news') {
    event.waitUntil(
      fetch('/api/news?all=true')
        .then(response => response.json())
        .then(data => {
          // IndexedDB에 저장
          return saveToIndexedDB(data)
        })
    )
  }
})
```

---

## ✅ Phase 7 체크리스트

- [ ] 프로덕션 빌드 실행 및 Service Worker 확인
- [ ] 캐싱 전략 테스트 (NetworkFirst, CacheFirst, etc.)
- [ ] IndexedDB 완전 구현
- [ ] 오프라인 감지 UI 추가
- [ ] 오프라인 데이터 사용 구현
- [ ] PWA Manifest 수정 (shortcuts, screenshots)
- [ ] Apple iOS 메타 태그 추가
- [ ] 모든 크기의 아이콘 생성
- [ ] 앱 업데이트 알림 구현
- [ ] 커스텀 설치 프롬프트 구현
- [ ] 백그라운드 동기화 (선택)
- [ ] Lighthouse PWA 점수 100 달성

## 📊 예상 결과

- **PWA 점수**: 70 → 100 (Lighthouse)
- **오프라인 작동**: 완전 지원
- **설치 가능**: iOS/Android 모두
- **업데이트 시스템**: 자동 감지 및 알림
- **사용자 경험**: 네이티브 앱 수준

---

# 통합 타임라인 및 우선순위

## 📅 전체 일정

| Phase | 작업 내용 | 소요 시간 | 우선순위 | 시작일 | 종료일 |
|-------|----------|----------|---------|-------|-------|
| 1-2 | ✅ 완료 | 1일 | 필수 | Day 0 | Day 1 |
| 3 | 테스트 | 2-3일 | 필수 | Day 2 | Day 4-5 |
| 4 | 성능 | 3-4일 | 권장 | Day 5-6 | Day 8-10 |
| 5 | 보안 | 2-3일 | 필수 | Day 9-11 | Day 11-14 |
| 6 | 접근성 | 2-3일 | 권장 | Day 12-15 | Day 14-18 |
| 7 | PWA | 1-2일 | 권장 | Day 15-19 | Day 16-21 |

**총 예상 기간**: 16-21일 (약 3주)

---

## 🎯 우선순위 매트릭스

### 꼭 해야 할 것 (필수) 🔴

**즉시 실행**:
- ✅ Phase 1-2: 코드 품질 기반 (완료)
- Phase 3: 테스트 인프라 - 안정성 필수
- Phase 5: 보안 강화 - 프로덕션 배포 전 필수

**이유**: 안정성, 보안, 법적 리스크 회피

---

### 하면 좋은 것 (권장) 🟡

**우선 순위 높음**:
- Phase 4: 성능 최적화 - 사용자 경험 직접 영향
- Phase 6: 접근성 개선 - 법적 요구사항 (지역/산업 따라)

**우선 순위 중간**:
- Phase 7: PWA 완성 - 경쟁력 강화, 사용자 참여도

**이유**: 사용자 만족도, 경쟁 우위, 법적 준수

---

### 나중에 해도 되는 것 (선택) ⚪

**추후 고려**:
- E2E 테스트 (Playwright) 전체 커버리지
- 고급 성능 마이크로 최적화
- 백그라운드 동기화
- 푸시 알림 (Phase 8)
- 고급 PWA 기능 (Share API, Web Bluetooth 등)

**이유**: 추가 기능, 고급 최적화, ROI 낮음

---

## 📊 통합 예상 성과

### Phase 1-7 완료 후

| 지표 | 현재 (Phase 2) | Phase 7 완료 | 개선 |
|------|---------------|-------------|------|
| **전체 진행률** | 50% | 100% | +100% |
| **테스트 커버리지** | 0% | 70% | +70% |
| **TypeScript 안전성** | 50% | 95% | +90% |
| **Lighthouse 성능** | 60 | 95+ | +58% |
| **번들 크기** | 200KB | 150KB | -25% |
| **초기 로드** | 3초 | <1초 | -66% |
| **접근성 점수** | 40 | 95+ | +137% |
| **보안 점수** | B | A | +1등급 |
| **PWA 점수** | 70 | 100 | +43% |

---

## 💡 단계별 시작 가이드

### Phase 3 시작하기

```bash
# 1. 패키지 설치
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom @types/jest

# 2. 설정 파일 생성
touch jest.config.js jest.setup.js

# 3. 첫 테스트 작성
mkdir -p src/utils/__tests__
touch src/utils/__tests__/logger.test.ts

# 4. 테스트 실행
npm test
```

### Phase 4 시작하기

```bash
# 1. Bundle Analyzer 설치
npm install --save-dev @next/bundle-analyzer

# 2. 분석 실행
ANALYZE=true npm run build

# 3. 서버 사이드 페이지네이션 구현
# (이미 API에서 지원 중 - 프론트엔드만 수정)
```

### Phase 5 시작하기

```bash
# 1. NextAuth 설치 (또는 Supabase Auth)
npm install next-auth

# 2. Zod 설치
npm install zod

# 3. 보안 헤더 설정
# next.config.js 수정

# 4. npm audit 실행
npm audit
npm audit fix
```

### Phase 6 시작하기

```bash
# 1. ESLint Plugin 설치
npm install --save-dev eslint-plugin-jsx-a11y

# 2. jest-axe 설치
npm install --save-dev jest-axe

# 3. ARIA 레이블 추가 시작
# (수동 작업 - 컴포넌트별로)

# 4. Lighthouse 실행
npx lighthouse http://localhost:3000 --view
```

### Phase 7 시작하기

```bash
# 1. 프로덕션 빌드
npm run build

# 2. IndexedDB 라이브러리 설치
npm install idb

# 3. 아이콘 생성 (PWA Asset Generator)
npx pwa-asset-generator public/logo.png public/icons

# 4. 프로덕션 서버 실행
npm run start
```

---

## 📝 체크리스트 요약

### Phase 3 체크리스트
- [ ] Jest 설정
- [ ] 유틸리티 테스트 (10+)
- [ ] 컴포넌트 테스트 (20+)
- [ ] API 테스트 (10+)
- [ ] 커버리지 60%+

### Phase 4 체크리스트
- [ ] Bundle 분석
- [ ] SSR 페이지네이션
- [ ] Image 최적화
- [ ] Lighthouse 90+

### Phase 5 체크리스트
- [ ] 인증 시스템
- [ ] Input 검증
- [ ] 보안 헤더
- [ ] npm audit 0 취약점

### Phase 6 체크리스트
- [ ] ARIA 레이블 100%
- [ ] 키보드 네비게이션
- [ ] 색상 대비 4.5:1+
- [ ] 스크린 리더 테스트

### Phase 7 체크리스트
- [ ] Service Worker 확인
- [ ] IndexedDB 구현
- [ ] 오프라인 UI
- [ ] PWA Lighthouse 100

---

## 🚀 빠른 시작 (최소 구성)

시간이 부족한 경우, 다음 최소 구성만 구현:

### 2주 계획

**Week 1**:
- Day 1-2: Phase 3 (테스트 - 핵심만)
- Day 3-5: Phase 5 (보안 - 필수만)

**Week 2**:
- Day 1-3: Phase 4 (성능 - 주요만)
- Day 4-5: Phase 6-7 (접근성/PWA - 기본만)

**핵심 항목**:
- ✅ 테스트: API + 주요 컴포넌트 5개
- ✅ 보안: 인증 + Input 검증
- ✅ 성능: SSR 페이지네이션 + 번들 최적화
- ✅ 접근성: ARIA 레이블 + 키보드
- ✅ PWA: 오프라인 기본 지원

---

## 📞 다음 단계

이 가이드를 저장한 후:

1. **Phase 3부터 시작**: 테스트 인프라 구축
2. **문서 참고**: `QUALITY_IMPROVEMENTS_PROGRESS.md`로 진행 상황 추적
3. **단계별 커밋**: 각 Phase 완료 후 커밋
4. **Lighthouse 측정**: 각 Phase 후 점수 확인

**질문이나 막히는 부분이 있으면**: 이 문서의 코드 예제와 체크리스트를 참고하세요.

---

**문서 끝** - Phase 3-7 구현 가이드
