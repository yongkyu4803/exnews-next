// API에 추가할 환경변수 검증 코드
// subscribe.ts의 handler 함수 시작 부분에 추가

console.log('[Subscribe API] 환경변수 확인:', {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
  anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
  // 로컬 .env.local의 키와 비교
  matchesLocal: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4d3p0ZmRucmFnZmZ4Ym1sc2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NzU2MDgsImV4cCI6MjA1ODA1MTYwOH0.KN8cR6_xHHHfuF1odUi9WwzkbOHCmwuRaK0FYe7b0Ig'
});
