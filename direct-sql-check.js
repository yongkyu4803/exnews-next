const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rxwztfdnragffxbmlscf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4d3p0ZmRucmFnZmZ4Ym1sc2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NzU2MDgsImV4cCI6MjA1ODA1MTYwOH0.KN8cR6_xHHHfuF1odUi9WwzkbOHCmwuRaK0FYe7b0Ig'
);

async function rawSqlCheck() {
  // Raw SQL로 직접 조회
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        id,
        device_id,
        push_subscription,
        pg_typeof(push_subscription) as column_type,
        push_subscription IS NULL as is_null
      FROM user_notification_settings
      WHERE device_id = 'device_a7703729_mgztqtlc'
    `
  });

  if (error) {
    console.log('RPC 지원 안 됨, 일반 조회로 대체...');
    
    const { data: normalData, error: normalError } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('device_id', 'device_a7703729_mgztqtlc')
      .single();
    
    console.log('조회 결과:', {
      push_subscription: normalData?.push_subscription,
      raw_value: JSON.stringify(normalData?.push_subscription)
    });
  } else {
    console.log('SQL 조회 결과:', data);
  }
}

rawSqlCheck().then(() => process.exit(0));
