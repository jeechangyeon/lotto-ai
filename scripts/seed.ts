// ============================================
// 데이터 시딩 스크립트
// 사용법: npx ts-node scripts/seed.ts
// ============================================

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 환경 변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DrawingData {
  round_no: number;
  draw_date: string;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus: number;
}

async function seedDrawings() {
  console.log('📊 당첨번호 데이터 시딩 시작...\n');

  // JSON 파일 읽기
  const dataPath = path.join(__dirname, '../data/drawings.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const drawings: DrawingData[] = JSON.parse(rawData);

  console.log(`총 ${drawings.length}개 데이터 로드됨\n`);

  // 배치 삽입 (100개씩)
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < drawings.length; i += batchSize) {
    const batch = drawings.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('drawings')
      .upsert(batch, { onConflict: 'round_no' });

    if (error) {
      console.error(`배치 ${i / batchSize + 1} 에러:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      console.log(`✅ 배치 ${i / batchSize + 1}: ${batch.length}개 완료 (${successCount}/${drawings.length})`);
    }
  }

  console.log('\n========================================');
  console.log(`✅ 성공: ${successCount}개`);
  if (errorCount > 0) {
    console.log(`❌ 실패: ${errorCount}개`);
  }
  console.log('========================================\n');
}

async function verifyData() {
  console.log('🔍 데이터 검증 중...\n');

  // 총 개수 확인
  const { count } = await supabase
    .from('drawings')
    .select('*', { count: 'exact', head: true });

  console.log(`DB 총 레코드: ${count}개`);

  // 최신 회차 확인
  const { data: latest } = await supabase
    .from('drawings')
    .select('*')
    .order('round_no', { ascending: false })
    .limit(1)
    .single();

  if (latest) {
    console.log(`\n최신 회차: ${latest.round_no}회`);
    console.log(`당첨번호: ${latest.num1}, ${latest.num2}, ${latest.num3}, ${latest.num4}, ${latest.num5}, ${latest.num6} + ${latest.bonus}`);
  }

  // 가장 오래된 회차 확인
  const { data: oldest } = await supabase
    .from('drawings')
    .select('round_no, draw_date')
    .order('round_no', { ascending: true })
    .limit(1)
    .single();

  if (oldest) {
    console.log(`\n가장 오래된 회차: ${oldest.round_no}회 (${oldest.draw_date})`);
  }
}

async function main() {
  try {
    await seedDrawings();
    await verifyData();
    console.log('\n✨ 시딩 완료!\n');
  } catch (error) {
    console.error('시딩 중 오류 발생:', error);
    process.exit(1);
  }
}

main();
