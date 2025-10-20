// 실제 데이터베이스에서 building_name 확인
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env 파일에서 환경변수 읽기
let supabaseUrl, supabaseKey;

try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
      supabaseUrl = value;
    } else if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
      supabaseKey = value;
    }
  });
} catch (error) {
  console.error('.env 파일을 읽을 수 없습니다:', error.message);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuildingNames() {
  console.log('=== 실제 DB에서 building_name 확인 ===\n');

  try {
    // building_name 칼럼을 포함하여 조회
    const { data: restaurants, error } = await supabase
      .from('nares')
      .select('id, name, location, building_name')
      .limit(10);

    if (error) {
      console.error('데이터 조회 오류:', error);
      return;
    }

    console.log(`조회된 레스토랑 수: ${restaurants.length}\n`);

    restaurants.forEach(restaurant => {
      console.log(`${restaurant.name}:`);
      console.log(`  위치: ${restaurant.location}`);
      console.log(`  빌딩명 (DB): ${restaurant.building_name || 'NULL'}\n`);
    });

    // building_name이 null이 아닌 레코드 수 확인
    const { count, error: countError } = await supabase
      .from('nares')
      .select('id', { count: 'exact', head: true })
      .not('building_name', 'is', null);

    if (countError) {
      console.error('카운트 조회 오류:', countError);
    } else {
      console.log(`빌딩명이 설정된 레스토랑 수: ${count}개`);
    }

  } catch (error) {
    console.error('확인 중 오류 발생:', error);
  }
}

checkBuildingNames();