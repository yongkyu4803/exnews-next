# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EXNEWS-Next** (단독뉴스) is a mobile-first Progressive Web Application for displaying exclusive news and ranking news content. Built with Next.js 15, TypeScript, and Supabase, it features dual-tab navigation, offline support, and virtual scrolling for optimal performance on mobile devices.

**Repository**: https://github.com/yongkyu4803/exnews-next

## Development Commands

```bash
# Start development server (localhost:3000)
npm run dev

# Build for production (generates .next/ directory)
npm run build

# Run production build locally
npm run start

# Run ESLint checks
npm run lint
```

**Note**: There are no test commands configured. Testing should be added if needed.

## Environment Setup

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rxwztfdnragffxbmlscf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

These are public variables exposed to the browser. The Supabase client is initialized in [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts).

## Architecture Overview

### Technology Stack

- **Next.js 15.2.3** - Using Pages Router (not App Router)
- **React 18.2.0** - Strict Mode disabled for compatibility with Ant Design
- **TypeScript 5.1.6** - Strict mode enabled
- **Ant Design 5.7.0** - Primary UI component library
- **Emotion** - CSS-in-JS styling solution
- **Supabase** - Backend database and authentication
- **React Query 3.39.3** - Server state management and caching
- **Redux Toolkit** - Client-side UI state management
- **next-pwa** - Progressive Web App support (production only)

### State Management Architecture

This project uses a **multi-layer state management strategy**:

1. **Redux Toolkit** ([src/store/](src/store/)) - Global UI state
   - `dataSlice` - News items, loading states, error handling
   - `uiSlice` - Pagination, selected category, page size

2. **React Query** - Server state and data fetching
   - Configured in [src/pages/_app.tsx](src/pages/_app.tsx)
   - Query keys: `['newsItems', category]`, `'rankingNewsItems'`, `'categories'`
   - `refetchOnWindowFocus: false` to prevent unnecessary refetching

3. **Local Storage / IndexedDB** - Persistent cache
   - Utils in [src/utils/indexedDBUtils.ts](src/utils/indexedDBUtils.ts)
   - User preferences in [src/utils/localStorage.ts](src/utils/localStorage.ts)

**Note**: Recoil is installed but not actively used.

### Data Flow Pattern

```
Component
  ↓
useQuery (React Query)
  ↓
/api/[endpoint] (Next.js API Routes)
  ↓
Supabase Client (src/lib/api.ts)
  ↓
Supabase Database
```

All API routes are in [src/pages/api/](src/pages/api/):
- `GET /api/news` - Exclusive news with pagination, category filtering
- `GET /api/ranking-news` - Trending news list
- `GET /api/categories` - Available categories
- `GET /api/restaurants` - Restaurant data

### Component Architecture

**Mobile-First Design**:
- Mobile components in [src/components/mobile/](src/components/mobile/)
- Desktop components in [src/components/](src/components/)
- Responsive detection at `max-width: 768px`

**Virtual Scrolling**:
- Uses `react-window` for efficient list rendering
- Components: [VirtualNewsList.tsx](src/components/mobile/VirtualNewsList.tsx), [VirtualRankingNewsList.tsx](src/components/mobile/VirtualRankingNewsList.tsx)
- Only renders visible DOM nodes to reduce memory usage

**Dynamic Imports**:
- Heavy components use `next/dynamic` with `ssr: false`
- Ant Design components loaded on-demand
- Reduces initial bundle size

### PWA Configuration

Configured in [next.config.js](next.config.js):

```javascript
// PWA only enabled in production
disable: !isProd

// Runtime caching strategy
handler: 'NetworkFirst'
cacheName: 'https-calls'
maxEntries: 150
maxAgeSeconds: 30 days

// Offline fallback
fallbacks: { document: '/offline' }
```

Service worker generated automatically by `next-pwa`. Offline page at [src/pages/offline.tsx](src/pages/offline.tsx).

### TypeScript Configuration

- **Path alias**: `@/*` maps to `src/*`
- **Strict mode**: Enabled
- **Target**: ES5 for broad browser compatibility
- **Module resolution**: Node

Example import:
```typescript
import { supabase } from '@/lib/supabaseClient'
import { NewsItem } from '@/types'
```

## Key Features & Implementation Details

### Dual Tab Interface

Main page at [src/pages/index.tsx](src/pages/index.tsx) (~608 lines):

1. **🚨 단독 뉴스 (Exclusive News)**
   - Category tabs: 정치, 경제, 사회, 국제, 문화, 연예/스포츠, 기타
   - Pagination: 7 items per page on mobile
   - Virtual scrolling on mobile, table on desktop
   - Multi-select with clipboard copy

2. **📊 랭킹 뉴스 (Ranking News)**
   - Trending news aggregation
   - Similar selection and copy functionality
   - Invalid items filtered (requires id, title, link)

### Database Schema

Tables in Supabase (see [src/types.ts](src/types.ts)):

**NewsItem** (exclusive news):
```typescript
{
  id?: number | string
  title: string
  original_link: string
  pub_date: string
  category: string
  description?: string
  processed_at?: string
}
```

**RankingNewsItem**:
```typescript
{
  id?: number | string
  title: string
  link: string
  media_name: string
}
```

**Categories** enum:
```typescript
All | 정치 | 경제 | 사회 | 국제 | 문화 | 연예/스포츠 | 기타
```

### Mobile Optimizations

1. **Pull-to-Refresh** - `react-pull-to-refresh` for native gesture
2. **Swipe Detection** - `react-swipeable` for touch interactions
3. **Virtual Scrolling** - `react-window` renders only visible items
4. **Infinite Loader** - `react-window-infinite-loader` for pagination

### Analytics & Tracking

Ready for Google Analytics 4:
- [src/utils/analytics.ts](src/utils/analytics.ts) - Event tracking
- [src/utils/analyticsUtils.ts](src/utils/analyticsUtils.ts) - GA4 utilities
- Events: article views, category changes, clipboard copies, external links
- Web Vitals measurement (LCP, FID, CLS)

Push notifications support in [src/utils/pushNotification.ts](src/utils/pushNotification.ts).

## Important Configuration Notes

### next.config.js

```javascript
reactStrictMode: false  // Disabled for Ant Design compatibility

// Required for Ant Design to work with Next.js 15
transpilePackages: [
  'rc-util', 'rc-tree', 'rc-input', 'antd',
  '@ant-design', 'rc-pagination', 'rc-picker',
  '@rc-component', 'rc-table'
]

images: {
  unoptimized: true  // Image optimization disabled
}
```

### Pages Router vs App Router

This project uses **Pages Router** despite Next.js 15 supporting App Router. Key differences:

- API routes in `src/pages/api/` directory
- App entry point is `src/pages/_app.tsx`
- Client-side rendering with `ssr: false` for main page
- No `app/` directory

## Common Development Patterns

### Adding a New API Endpoint

1. Create file in [src/pages/api/](src/pages/api/)
2. Use Supabase client from `@/lib/supabaseClient`
3. Return JSON response with error handling

Example:
```typescript
import { supabase } from '@/lib/supabaseClient'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')

    if (error) throw error
    res.status(200).json({ data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

### Adding a New Mobile Component

1. Create in [src/components/mobile/](src/components/mobile/)
2. Use Emotion styled components for styling
3. Implement responsive design with media queries
4. Use virtual scrolling for lists

Example:
```typescript
import styled from '@emotion/styled'

const Container = styled.div`
  padding: 16px;

  @media (max-width: 768px) {
    padding: 8px;
  }
`
```

### Using React Query for Data Fetching

```typescript
import { useQuery } from 'react-query'

const { data, isLoading, error } = useQuery(
  ['newsItems', selectedCategory],
  () => fetch('/api/news?category=' + selectedCategory).then(r => r.json()),
  {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  }
)
```

### Updating Redux State

```typescript
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentPage, setSelectedCategory } from '@/store/slices/uiSlice'

const dispatch = useDispatch()
const { currentPage, selectedCategory } = useSelector((state) => state.ui)

dispatch(setCurrentPage(2))
dispatch(setSelectedCategory('정치'))
```

## Performance Considerations

1. **Virtual Scrolling** - Use for lists >50 items
2. **Dynamic Imports** - Use `next/dynamic` for heavy components
3. **PWA Caching** - Production builds cache HTTP requests (30 days)
4. **Code Splitting** - Ant Design components loaded on-demand
5. **IndexedDB** - Use for offline data persistence

## Known Limitations

- No automated tests configured
- Image optimization disabled (`unoptimized: true`)
- React Strict Mode disabled for Ant Design compatibility
- Service worker only runs in production builds
- No server-side rendering on main page (`ssr: false`)

## Future Roadmap

Based on project documentation:

1. **Admin Panel** - Full CRUD functionality ([src/pages/admin/](src/pages/admin/))
2. **Advanced Search** - Full-text search capabilities
3. **Push Notifications** - Real-time alerts for new articles
4. **Subscription Management** - User subscription system
5. **Restaurant Features** - Dedicated restaurant listing

## Deployment

- **Platform**: Vercel
- **Branch**: `main`
- **Build Command**: `npm run build`
- **Output Directory**: `.next/`
- **Environment Variables**: Set in Vercel dashboard

Git push to `main` triggers automatic deployment.

## File Structure Reference

```
src/
├── components/
│   ├── mobile/          # Mobile-optimized components
│   ├── common/          # Reusable components
│   ├── layouts/         # Layout components
│   └── Admin/           # Admin panel components
├── pages/
│   ├── _app.tsx         # App wrapper with providers
│   ├── index.tsx        # Main home page (dual tabs)
│   ├── api/             # API routes
│   ├── admin/           # Admin pages
│   └── offline.tsx      # PWA offline fallback
├── store/
│   ├── index.ts         # Redux store configuration
│   └── slices/          # Redux slices
├── lib/
│   ├── supabaseClient.ts  # Supabase initialization
│   └── api.ts             # Data fetching functions
├── utils/               # Utility functions
├── types/               # TypeScript types
└── styles/              # Global and component styles
```

## Quick Reference

**Supabase Tables**: `news`, `ranking_news`, `restaurants`

**Main Dependencies**:
- UI: Ant Design 5.7.0, Emotion
- State: Redux Toolkit, React Query
- Database: Supabase JS Client 2.26.0
- Mobile: react-window, react-pull-to-refresh, react-swipeable
- PWA: next-pwa 5.6.0

**Key Files**:
- [src/pages/index.tsx](src/pages/index.tsx) - Main page (608 lines)
- [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts) - Database client
- [next.config.js](next.config.js) - PWA and build configuration
- [src/types.ts](src/types.ts) - Core data types
