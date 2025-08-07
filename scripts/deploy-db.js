#!/usr/bin/env node
/**
 * 데이터베이스 스키마 배포 스크립트
 * database/ 폴더의 SQL 파일들을 Supabase에 자동 적용
 */

const fs = require('fs');
const path = require('path');

console.log('🗄️ 데이터베이스 배포 가이드');
console.log('='.repeat(50));

console.log('\n📋 수동 배포 방법:');
console.log('1. Supabase 대시보드 접속:');
console.log('   https://duncdnrqftxfcpqpvolz.supabase.co/project/duncdnrqftxfcpqpvolz');
console.log('\n2. 왼쪽 메뉴에서 "SQL Editor" 클릭');
console.log('\n3. "New query" 버튼 클릭');

console.log('\n4. 다음 SQL 실행:');
console.log('='.repeat(30));

try {
  // update-psychological-table.sql 파일 읽기
  const sqlFile = path.join(__dirname, '../database/update-psychological-table.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  
  // 주석 제거하고 실행할 SQL만 추출
  const sqlCommands = sqlContent
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim())
    .join('\n');
    
  console.log(sqlCommands);
  console.log('='.repeat(30));
  
  console.log('\n5. "RUN" 버튼 클릭하여 실행');
  console.log('\n✅ 성공하면 완료!');
  
} catch (error) {
  console.error('❌ SQL 파일 읽기 오류:', error.message);
}

console.log('\n🚀 CLI 사용법 (고급):');
console.log('1. brew install supabase/tap/supabase');
console.log('2. supabase login');
console.log('3. supabase link --project-ref duncdnrqftxfcpqpvolz');
console.log('4. supabase db push');