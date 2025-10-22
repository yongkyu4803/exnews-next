const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rxwztfdnragffxbmlscf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4d3p0ZmRucmFnZmZ4Ym1sc2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NzU2MDgsImV4cCI6MjA1ODA1MTYwOH0.KN8cR6_xHHHfuF1odUi9WwzkbOHCmwuRaK0FYe7b0Ig'
);

async function checkRow() {
  console.log('1️⃣ 특정 ID로 조회...');
  const { data: byId, error: idError } = await supabase
    .from('user_notification_settings')
    .select('*')
    .eq('id', '85733c23-d86c-4bd7-a09f-cd72a431fabc')
    .single();

  if (idError) {
    console.error('❌ ID 조회 에러:', idError);
  } else {
    console.log('✅ ID로 찾은 행:', {
      id: byId.id,
      device_id: byId.device_id,
      push_subscription: byId.push_subscription,
      push_subscription_type: typeof byId.push_subscription,
      is_null: byId.push_subscription === null
    });
  }

  console.log('\n2️⃣ device_id로 모든 행 조회...');
  const { data: byDeviceId, error: deviceError } = await supabase
    .from('user_notification_settings')
    .select('id, device_id, push_subscription')
    .eq('device_id', 'device_a7703729_mgztqtlc');

  if (deviceError) {
    console.error('❌ device_id 조회 에러:', deviceError);
  } else {
    console.log(`✅ device_id로 찾은 행 개수: ${byDeviceId.length}`);
    byDeviceId.forEach((row, idx) => {
      console.log(`\n행 ${idx + 1}:`, {
        id: row.id,
        device_id: row.device_id,
        push_subscription: row.push_subscription,
        is_null: row.push_subscription === null
      });
    });
  }
}

checkRow().then(() => {
  console.log('\n✅ 조회 완료!');
  process.exit(0);
}).catch(err => {
  console.error('❌ 에러:', err);
  process.exit(1);
});
