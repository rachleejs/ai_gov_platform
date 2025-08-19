import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ Deep Metrics DB 테이블 생성 시작...');

    // 1. 평가 기록 테이블 생성
    const createEvaluationsTable = `
      CREATE TABLE IF NOT EXISTS deep_metric_evaluations (
          id SERIAL PRIMARY KEY,
          evaluation_id VARCHAR(255) UNIQUE NOT NULL,
          ethics_category VARCHAR(100) NOT NULL,
          evaluation_type VARCHAR(20) NOT NULL CHECK (evaluation_type IN ('quality', 'security')),
          framework VARCHAR(50) NOT NULL,
          models JSONB NOT NULL,
          start_time TIMESTAMPTZ,
          end_time TIMESTAMPTZ,
          progress INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'error')),
          summary JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const { error: evalTableError } = await supabase.rpc('exec_sql', { 
      sql: createEvaluationsTable 
    });

    if (evalTableError) {
      throw new Error(`평가 테이블 생성 실패: ${evalTableError.message}`);
    }

    // 2. 모델별 상세 결과 테이블 생성
    const createResultsTable = `
      CREATE TABLE IF NOT EXISTS deep_metric_results (
          id SERIAL PRIMARY KEY,
          evaluation_id VARCHAR(255) NOT NULL,
          model_key VARCHAR(50) NOT NULL,
          model_name VARCHAR(100) NOT NULL,
          metric_key VARCHAR(100) NOT NULL,
          score NUMERIC(5,2) NOT NULL DEFAULT 0,
          passed BOOLEAN DEFAULT FALSE,
          details JSONB,
          response_data JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const { error: resultsTableError } = await supabase.rpc('exec_sql', { 
      sql: createResultsTable 
    });

    if (resultsTableError) {
      throw new Error(`결과 테이블 생성 실패: ${resultsTableError.message}`);
    }

    // 3. 인덱스 생성
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_deep_evaluations_category ON deep_metric_evaluations(ethics_category);
      CREATE INDEX IF NOT EXISTS idx_deep_evaluations_type ON deep_metric_evaluations(evaluation_type);
      CREATE INDEX IF NOT EXISTS idx_deep_evaluations_status ON deep_metric_evaluations(status);
      CREATE INDEX IF NOT EXISTS idx_deep_evaluations_created ON deep_metric_evaluations(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_deep_results_evaluation ON deep_metric_results(evaluation_id);
      CREATE INDEX IF NOT EXISTS idx_deep_results_model ON deep_metric_results(model_key);
      CREATE INDEX IF NOT EXISTS idx_deep_results_metric ON deep_metric_results(metric_key);
      CREATE INDEX IF NOT EXISTS idx_deep_results_score ON deep_metric_results(score DESC);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', { 
      sql: createIndexes 
    });

    if (indexError) {
      console.warn('인덱스 생성 경고:', indexError.message);
    }

    // 4. 테스트 쿼리로 테이블 생성 확인
    const { data: tables, error: testError } = await supabase
      .from('deep_metric_evaluations')
      .select('*')
      .limit(1);

    if (testError) {
      throw new Error(`테이블 확인 실패: ${testError.message}`);
    }

    console.log('✅ Deep Metrics DB 테이블 생성 완료!');

    return NextResponse.json({
      success: true,
      message: 'Deep Metrics DB 테이블이 성공적으로 생성되었습니다.',
      tables: ['deep_metric_evaluations', 'deep_metric_results']
    });

  } catch (error) {
    console.error('DB 테이블 생성 실패:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
