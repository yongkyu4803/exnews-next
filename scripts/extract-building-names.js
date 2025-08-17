// 빌딩명 추출 및 마이그레이션 스크립트
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
    } else if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
      supabaseKey = value; // 서비스 롤 키 사용
    }
  });
} catch (error) {
  console.error('.env 파일을 읽을 수 없습니다:', error.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * location 문자열에서 빌딩명을 추출하는 함수
 * @param {string} location - 위치 정보 문자열
 * @returns {string|null} - 추출된 빌딩명 또는 null
 */
function extractBuildingName(location) {
  if (!location || typeof location !== 'string') {
    return null;
  }

  // 패턴 1: 복합 명칭 (특수한 경우들)
  const complexPatterns = [
    /교육시설재난공제회관/g,
    /진미파라곤/g,
    /서울국제금융센터/g,
    /여의도전자랜드/g,
    /한국스카우트연맹/g,
    /LG에클라트/g
  ];

  for (const pattern of complexPatterns) {
    const match = location.match(pattern);
    if (match) {
      return match[0];
    }
  }

  // 패턴 2: 일반적인 빌딩명 패턴
  const buildingPatterns = [
    /([가-힣\w]+빌딩)/g,
    /([가-힣\w]+센터)/g,
    /([가-힣\w]+타워)/g,
    /([가-힣\w]+관)/g,
    /([가-힣\w]+프라자)/g,
    /([가-힣\w]+오피스)/g,
    /([가-힣\w]+연맹)/g,
    /(LG[가-힣\w]+)/g,
    /([A-Z]+[가-힣\w]*)/g
  ];

  for (const pattern of buildingPatterns) {
    const match = location.match(pattern);
    if (match) {
      const extracted = match[0];
      // "B1", "1F" 같은 층수 정보는 제외
      if (extracted.match(/^[B0-9]+[F1-9]*$/)) {
        continue;
      }
      return extracted;
    }
  }

  // 패턴 3: 도로명이나 동명에서 지역 정보 추출 (건물명이 없는 경우)
  const roadPattern = /([가-힣]+대로|[가-힣]+로|[가-힣]+길)/g;
  const roadMatch = location.match(roadPattern);
  if (roadMatch) {
    return `${roadMatch[0]} 지역`;
  }

  const dongPattern = /([가-힣]+동)/g;
  const dongMatch = location.match(dongPattern);
  if (dongMatch && !location.includes('빌딩') && !location.includes('센터')) {
    return `${dongMatch[0]} 지역`;
  }

  return null;
}

/**
 * 현재 데이터에서 빌딩명 추출 테스트
 */
async function testBuildingExtraction() {
  console.log('=== 빌딩명 추출 테스트 ===\n');

  try {
    // 샘플 데이터 가져오기
    const { data: restaurants, error } = await supabase
      .from('nares')
      .select('id, name, location')
      .limit(20);

    if (error) {
      console.error('데이터 조회 오류:', error);
      return;
    }

    console.log(`총 ${restaurants.length}개 레스토랑 데이터로 테스트\n`);

    const results = [];
    const buildingCounts = {};

    restaurants.forEach(restaurant => {
      const buildingName = extractBuildingName(restaurant.location);
      
      results.push({
        id: restaurant.id,
        name: restaurant.name,
        location: restaurant.location,
        extractedBuilding: buildingName
      });

      if (buildingName) {
        buildingCounts[buildingName] = (buildingCounts[buildingName] || 0) + 1;
      }
    });

    // 결과 출력
    console.log('=== 추출 결과 ===');
    results.forEach(result => {
      console.log(`${result.name}:`);
      console.log(`  위치: ${result.location}`);
      console.log(`  빌딩: ${result.extractedBuilding || '추출 실패'}\n`);
    });

    console.log('=== 빌딩별 통계 ===');
    Object.entries(buildingCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([building, count]) => {
        console.log(`${building}: ${count}개`);
      });

    const extractedCount = results.filter(r => r.extractedBuilding).length;
    console.log(`\n추출 성공률: ${extractedCount}/${results.length} (${Math.round(extractedCount/results.length*100)}%)`);

    return results;
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
  }
}

/**
 * 실제 데이터베이스 업데이트 (주의: 실제 데이터 수정)
 */
async function updateBuildingNames() {
  console.log('=== 빌딩명 업데이트 시작 ===\n');

  try {
    // 전체 데이터 가져오기
    const { data: restaurants, error } = await supabase
      .from('nares')
      .select('id, name, location');

    if (error) {
      console.error('데이터 조회 오류:', error);
      return;
    }

    console.log(`총 ${restaurants.length}개 레스토랑 데이터 처리 중...\n`);

    let successCount = 0;
    let failCount = 0;

    for (const restaurant of restaurants) {
      const buildingName = extractBuildingName(restaurant.location);
      
      if (buildingName) {
        // 빌딩명 업데이트
        const { error: updateError } = await supabase
          .from('nares')
          .update({ building_name: buildingName })
          .eq('id', restaurant.id);

        if (updateError) {
          console.error(`ID ${restaurant.id} 업데이트 실패:`, updateError);
          failCount++;
        } else {
          console.log(`✓ ${restaurant.name} → ${buildingName}`);
          successCount++;
        }
      } else {
        console.log(`⚠ ${restaurant.name}: 빌딩명 추출 실패 (${restaurant.location})`);
        failCount++;
      }
    }

    console.log(`\n=== 업데이트 완료 ===`);
    console.log(`성공: ${successCount}개`);
    console.log(`실패: ${failCount}개`);
    console.log(`총계: ${successCount + failCount}개`);

  } catch (error) {
    console.error('업데이트 중 오류 발생:', error);
  }
}

// 스크립트 실행
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testBuildingExtraction();
  } else if (args.includes('--update')) {
    console.log('⚠️  실제 데이터베이스를 수정합니다...\n');
    await updateBuildingNames();
  } else if (args.includes('--force-update')) {
    console.log('강제 업데이트를 시작합니다...\n');
    await updateBuildingNames();
  } else {
    console.log('사용법:');
    console.log('  node extract-building-names.js --test         # 테스트 실행');
    console.log('  node extract-building-names.js --update       # 실제 업데이트');
    console.log('  node extract-building-names.js --force-update # 강제 업데이트');
  }
}

if (require.main === module) {
  main();
}

module.exports = { extractBuildingName };