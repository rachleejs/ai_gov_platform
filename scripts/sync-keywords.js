#!/usr/bin/env node
/**
 * 키워드 동기화 스크립트
 * customization.py에서 키워드를 추출하여 psychologicalEvaluator.ts에 자동으로 반영
 */

const fs = require('fs');
const path = require('path');

// 파일 경로 설정
const PYTHON_FILE = '/Users/ijisoo/Documents/model_evaluation/evaluation/psychological_evaluation/framework/customization.py';
const TS_FILE = path.join(__dirname, '../lib/psychologicalEvaluator.ts');

function extractKeywordsFromPython() {
  try {
    const content = fs.readFileSync(PYTHON_FILE, 'utf8');
    const keywords = {};
    
    // 각 카테고리별 키워드 추출
    const categories = {
      'PIAGET_KEYWORDS': 'step_by_step_teaching',
      'VYGOTSKY_KEYWORDS': 'collaborative_learning',
      'BANDURA_KEYWORDS': 'confidence_building',
      'SOCIAL_IDENTITY_KEYWORDS': 'individual_recognition',
      'INFORMATION_PROCESSING_KEYWORDS': 'clear_communication'
    };
    
    Object.entries(categories).forEach(([pythonCategory, tsCategory]) => {
      const regex = new RegExp(`${pythonCategory}\\s*=\\s*{([^}]+)}`, 's');
      const match = content.match(regex);
      
      if (match) {
        const categoryContent = match[1];
        const allKeywords = [];
        
        // 각 서브카테고리에서 키워드 추출
        const keywordRegex = /"([^"]+)"/g;
        let keywordMatch;
        while ((keywordMatch = keywordRegex.exec(categoryContent)) !== null) {
          if (!keywordMatch[1].includes('_')) { // 카테고리명 제외
            allKeywords.push(keywordMatch[1]);
          }
        }
        
        keywords[tsCategory] = allKeywords;
      }
    });
    
    return keywords;
  } catch (error) {
    console.error('Python 파일 읽기 오류:', error);
    return null;
  }
}

function updateTypeScriptFile(keywords) {
  try {
    let content = fs.readFileSync(TS_FILE, 'utf8');
    
    Object.entries(keywords).forEach(([category, keywordList]) => {
      // 기존 키워드 배열 찾기
      const regex = new RegExp(`(${category}:\\s*{[^}]*keywords:\\s*)\\[([^\\]]+)\\]`, 's');
      const match = content.match(regex);
      
      if (match) {
        const newKeywords = JSON.stringify(keywordList);
        const replacement = match[1] + newKeywords;
        content = content.replace(regex, replacement);
        console.log(`✅ ${category} 키워드 업데이트 완료 (${keywordList.length}개)`);
      } else {
        console.warn(`⚠️ ${category} 섹션을 찾을 수 없습니다.`);
      }
    });
    
    fs.writeFileSync(TS_FILE, content, 'utf8');
    console.log('🚀 TypeScript 파일 업데이트 완료!');
    return true;
  } catch (error) {
    console.error('TypeScript 파일 업데이트 오류:', error);
    return false;
  }
}

function main() {
  console.log('🔄 키워드 동기화 시작...');
  
  // Python 파일에서 키워드 추출
  const keywords = extractKeywordsFromPython();
  if (!keywords) {
    console.error('❌ 키워드 추출 실패');
    process.exit(1);
  }
  
  console.log('📖 추출된 키워드 카테고리:', Object.keys(keywords));
  
  // TypeScript 파일 업데이트
  const success = updateTypeScriptFile(keywords);
  if (!success) {
    console.error('❌ 파일 업데이트 실패');
    process.exit(1);
  }
  
  console.log('✨ 키워드 동기화 완료!');
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { extractKeywordsFromPython, updateTypeScriptFile };