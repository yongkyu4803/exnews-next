# Supabase 클라이언트 생성 비교

## 로컬 스크립트 (성공) ✅
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rxwztfdnragffxbmlscf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);
// 기본 옵션 사용, 추가 설정 없음
```

## API 코드 (실패) ❌
```typescript
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// 동일하게 기본 옵션 사용
```

## 차이점 분석

### 실행 환경
- **로컬 스크립트**: Node.js 직접 실행, 로컬 네트워크
- **API 코드**: Vercel Serverless Function, 클라우드 환경

### 가능한 차이
1. **HTTP Headers**: Vercel은 추가 헤더를 붙일 수 있음
2. **네트워크 경로**: 다른 리전에서 접속
3. **타임아웃 설정**: Serverless 함수의 타임아웃
4. **환경변수 로딩 시점**: Next.js 빌드 타임 vs 런타임

### 의심 포인트
- Vercel 환경변수가 **다른 값**일 가능성
- 만료되었거나 권한이 제한된 키일 가능성
