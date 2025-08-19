-- Deep Metrics 평가 결과 테이블 생성

-- 1. 평가 기록 테이블
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

-- 2. 모델별 상세 결과 테이블
CREATE TABLE IF NOT EXISTS deep_metric_results (
    id SERIAL PRIMARY KEY,
    evaluation_id VARCHAR(255) REFERENCES deep_metric_evaluations(evaluation_id) ON DELETE CASCADE,
    model_key VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    metric_key VARCHAR(100) NOT NULL,
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    details JSONB,
    response_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_deep_evaluations_category ON deep_metric_evaluations(ethics_category);
CREATE INDEX IF NOT EXISTS idx_deep_evaluations_type ON deep_metric_evaluations(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_deep_evaluations_status ON deep_metric_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_deep_evaluations_created ON deep_metric_evaluations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deep_results_evaluation ON deep_metric_results(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_deep_results_model ON deep_metric_results(model_key);
CREATE INDEX IF NOT EXISTS idx_deep_results_metric ON deep_metric_results(metric_key);
CREATE INDEX IF NOT EXISTS idx_deep_results_score ON deep_metric_results(score DESC);

-- 트리거로 updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deep_evaluations_updated_at 
    BEFORE UPDATE ON deep_metric_evaluations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 뷰 생성: 최신 평가 결과 요약
CREATE OR REPLACE VIEW deep_metrics_summary AS
SELECT 
    de.evaluation_id,
    de.ethics_category,
    de.evaluation_type,
    de.framework,
    de.status,
    de.created_at,
    de.summary,
    COUNT(dr.id) as total_results,
    AVG(dr.score) as avg_score,
    COUNT(CASE WHEN dr.passed THEN 1 END) as passed_count
FROM deep_metric_evaluations de
LEFT JOIN deep_metric_results dr ON de.evaluation_id = dr.evaluation_id
WHERE de.status = 'completed'
GROUP BY de.evaluation_id, de.ethics_category, de.evaluation_type, de.framework, de.status, de.created_at, de.summary
ORDER BY de.created_at DESC;

COMMENT ON TABLE deep_metric_evaluations IS 'Deep Metrics 평가 기록 테이블';
COMMENT ON TABLE deep_metric_results IS 'Deep Metrics 모델별 상세 결과 테이블';
COMMENT ON VIEW deep_metrics_summary IS 'Deep Metrics 평가 결과 요약 뷰';
