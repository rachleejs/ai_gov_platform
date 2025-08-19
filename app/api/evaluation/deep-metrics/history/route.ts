import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ethicsCategory = searchParams.get('category');
    const evaluationType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 파일에서 이전 결과 로드
    let evaluations = await loadPreviousResults();

    // 필터링
    if (ethicsCategory) {
      evaluations = evaluations.filter(e => 
        e.ethicsCategory === ethicsCategory || e.category === ethicsCategory
      );
    }

    if (evaluationType) {
      evaluations = evaluations.filter(e => e.evaluationType === evaluationType);
    }

    // 모든 결과를 반환하여 클라이언트에서 필터링
    evaluations = evaluations.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: evaluations,
      total: evaluations.length
    });

  } catch (error) {
    console.error('평가 히스토리 조회 실패:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }, { status: 500 });
  }
}

async function loadPreviousResults(): Promise<any[]> {
  try {
    const resultsDir = path.join(process.cwd(), 'evaluation-results');
    
    if (!fs.existsSync(resultsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(resultsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        stat: fs.statSync(path.join(resultsDir, f))
      }))
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime()) // 수정 시간 기준 최신순
      .map(f => f.name);
    
    const results = [];
    
    for (const file of files.slice(0, 20)) { // 최신 20개
      try {
        const filepath = path.join(resultsDir, file);
        const content = await readFile(filepath, 'utf-8');
        const result = JSON.parse(content);
        result.created_at = result.startTime; // 호환성을 위해 추가
        results.push(result);
      } catch (error) {
        console.warn(`파일 로드 실패: ${file}`, error);
      }
    }
    
    return results.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  } catch (error) {
    console.warn('이전 결과 로드 실패:', error);
    return [];
  }
}
