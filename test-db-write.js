const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rxwztfdnragffxbmlscf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4d3p0ZmRucmFnZmZ4Ym1sc2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NzU2MDgsImV4cCI6MjA1ODA1MTYwOH0.KN8cR6_xHHHfuF1odUi9WwzkbOHCmwuRaK0FYe7b0Ig'
);

async function testWrite() {
  console.log('1️⃣ 테스트 구독 객체 생성...');
  const testSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/TEST123',
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key'
    }
  };
  
  console.log('2️⃣ 객체 타입:', typeof testSubscription);
  console.log('3️⃣ JSON 문자열:', JSON.stringify(testSubscription));
  
  console.log('\n4️⃣ 기존 레코드 조회...');
  const { data: existing, error: selectError } = await supabase
    .from('user_notification_settings')
    .select('*')
    .eq('device_id', 'device_a7703729_mgztqtlc')
    .single();
  
  if (selectError) {
    console.error('❌ 조회 에러:', selectError);
    return;
  }
  
  console.log('✅ 기존 레코드 발견:', existing.id);
  console.log('현재 push_subscription:', existing.push_subscription);
  
  console.log('\n5️⃣ 업데이트 시도 (객체 직접 전달)...');
  const { data: updated, error: updateError } = await supabase
    .from('user_notification_settings')
    .update({
      push_subscription: testSubscription,
      updated_at: new Date().toISOString()
    })
    .eq('device_id', 'device_a7703729_mgztqtlc')
    .select()
    .single();
  
  if (updateError) {
    console.error('❌ 업데이트 에러:', updateError);
    return;
  }
  
  console.log('✅ 업데이트 성공!');
  console.log('반환된 push_subscription:', updated.push_subscription);
  console.log('타입:', typeof updated.push_subscription);
  
  console.log('\n6️⃣ 업데이트 후 재조회...');
  const { data: verify, error: verifyError } = await supabase
    .from('user_notification_settings')
    .select('id, device_id, push_subscription')
    .eq('device_id', 'device_a7703729_mgztqtlc')
    .single();
  
  if (verifyError) {
    console.error('❌ 재조회 에러:', verifyError);
    return;
  }
  
  console.log('✅ 재조회 결과:');
  console.log('  push_subscription:', verify.push_subscription);
  console.log('  is_null:', verify.push_subscription === null);
}

testWrite().then(() => {
  console.log('\n✅ 테스트 완료!');
  process.exit(0);
}).catch(err => {
  console.error('❌❌❌ 에러:', err);
  process.exit(1);
});
