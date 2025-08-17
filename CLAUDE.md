# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **exnews-next**, a scalable database viewer and rendering web application built with Next.js and Supabase. It's designed as a news platform that displays exclusive news articles and ranking news with mobile-first design principles.

### Core Features
- **Dual News Views**: Exclusive news (단독 뉴스) and ranking news (랭킹 뉴스) with separate data sources
- **Mobile-First PWA**: Progressive Web App with responsive design optimized for mobile devices
- **Data Management**: Supabase backend with category filtering, pagination, and search functionality
- **Admin Interface**: Restaurant management and data administration capabilities

## Development Commands

### Essential Commands
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

### Testing & Development
- No test scripts are currently configured
- Use browser dev tools for mobile testing and PWA features
- Supabase dashboard for database management

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.2.3 with TypeScript
- **UI Library**: Ant Design (antd) with custom mobile components
- **State Management**: Dual approach with Redux Toolkit + Recoil
- **Data Fetching**: React Query for API state management
- **Database**: Supabase for backend services
- **PWA**: next-pwa for offline functionality and app-like experience

### Key Architecture Patterns

#### Mobile-First Responsive Design
- Uses media queries (`max-width: 768px`) to switch between mobile and desktop layouts
- Virtual scrolling with `react-window` for performance optimization
- Custom mobile components in `/src/components/mobile/`

#### Data Layer Architecture
```
API Routes (/pages/api/) → Supabase Client → React Query → Components
```

#### Dual State Management
- **Redux Toolkit**: UI state management (`uiSlice`, `dataSlice`)
- **React Query**: Server state management and caching
- **Local State**: Component-level state for UI interactions

#### Component Structure
- **Desktop**: Table-based layouts using Ant Design tables
- **Mobile**: Virtual lists with card-based components
- **Shared**: Common utilities in `/src/components/common/`

### Database Schema (Supabase)

#### Primary Tables
- **news**: Main news articles table
  - `title`, `original_link`, `pub_date`, `category`
- **ranking_news**: Trending/ranking news
  - `title`, `link`, `media_name`
- **restaurants**: Restaurant information
  - `category`, `name`, `location`, `pnum`, `price`

### Configuration Files

#### Next.js Configuration (`next.config.js`)
- PWA configuration with offline support
- Ant Design transpilation for SSR compatibility
- Image optimization disabled (`unoptimized: true`)
- Runtime caching strategy for network-first approach

#### TypeScript Configuration
- Path aliases: `@/*` maps to `src/*`
- Strict mode enabled
- JSX preserve mode for Next.js optimization

## Development Guidelines

### Mobile Development
- Always test responsive breakpoints at 768px
- Use `isMobile` state for conditional rendering
- Implement virtual scrolling for lists with >20 items
- Ensure touch targets are minimum 44px for accessibility

### PWA Features
- Service worker automatically generated in production
- Offline page available at `/offline`
- App manifest configured for installable PWA
- Cache strategy: NetworkFirst with 30-day expiration

### API Development
- All API routes in `/pages/api/`
- Use consistent response format: `{ items: [], totalCount: number }`
- Implement proper error handling with descriptive messages
- Supabase client instance: `/src/lib/supabaseClient.ts`

### State Management Patterns
- Use React Query for all server state and API calls
- Redux for complex UI state that needs global access
- Local state for component-specific interactions
- Consistent query keys: `['newsItems', category]`, `'rankingNewsItems'`

### Component Development
- Dynamic imports for Ant Design components to reduce bundle size
- SSR disabled for main components using `dynamic(() => Promise.resolve(Component), { ssr: false })`
- Consistent prop interfaces defined in `/src/types.ts`

### Performance Considerations
- Virtual scrolling implemented for mobile news lists
- Dynamic component loading to reduce initial bundle
- Image optimization disabled for compatibility
- React strict mode disabled for Ant Design compatibility

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Common Development Patterns

### Adding New News Categories
1. Update `Categories` enum in `/src/types.ts`
2. Add new tab item in main page tabs configuration
3. Update category filtering logic in API routes

### Creating Mobile Components
- Follow pattern in `/src/components/mobile/`
- Implement virtual scrolling for performance
- Use consistent card-based layouts
- Include touch-friendly interaction patterns

### Database Queries
- Use `/src/lib/api.ts` for consistent query patterns
- Implement client-side sorting for better UX
- Always include error handling and loading states
- Use React Query for caching and background updates

### Admin Interface Development
- Admin routes: `/pages/admin/[id].tsx` and `/pages/admin/index.tsx`
- Separate table components for different data types
- Include search, filter, and pagination functionality