-- AI 거버넌스 플랫폼 데이터베이스 스키마
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY, -- Supabase Auth ID와 일치해야 함
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_guest BOOLEAN DEFAULT false,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('admin', 'expert', 'user')) DEFAULT 'user'
);

-- 2. AI 모델 테이블
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 3. 평가 결과 테이블
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
    evaluation_type TEXT CHECK (evaluation_type IN ('ethics', 'psychology', 'scenario', 'expert')) NOT NULL,
    category TEXT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    grade TEXT NOT NULL,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 감사 로그 테이블
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
    auditor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    audit_type TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
    findings TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 성능 메트릭 테이블
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
    benchmark_name TEXT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    test_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX idx_evaluations_model_id ON evaluations(model_id);
CREATE INDEX idx_evaluations_type ON evaluations(evaluation_type);
CREATE INDEX idx_audit_logs_model_id ON audit_logs(model_id);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_performance_metrics_model_id ON performance_metrics(model_id);
CREATE INDEX idx_performance_metrics_benchmark ON performance_metrics(benchmark_name);

-- 7. RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회/수정 가능
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- AI 모델은 모든 사용자가 조회 가능
CREATE POLICY "AI models are viewable by everyone" ON ai_models
    FOR SELECT USING (true);

-- 평가 결과는 작성자만 조회/수정 가능
CREATE POLICY "Users can view own evaluations" ON evaluations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evaluations" ON evaluations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evaluations" ON evaluations
    FOR UPDATE USING (auth.uid() = user_id);

-- 감사 로그는 관리자와 전문가만 조회 가능
CREATE POLICY "Audit logs viewable by admins and experts" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'expert')
        )
    );

-- 성능 메트릭은 모든 사용자가 조회 가능
CREATE POLICY "Performance metrics are viewable by everyone" ON performance_metrics
    FOR SELECT USING (true);

-- 8. 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 업데이트 트리거 생성
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at
    BEFORE UPDATE ON ai_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_logs_updated_at
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. 기본 AI 모델 데이터 삽입
INSERT INTO ai_models (name, provider, model_type, description) VALUES
('GPT-4', 'OpenAI', 'Large Language Model', 'OpenAI의 최신 대화형 AI 모델'),
('GPT-3.5', 'OpenAI', 'Large Language Model', 'OpenAI의 효율적인 대화형 AI 모델'),
('Claude-3-Opus', 'Anthropic', 'Large Language Model', 'Anthropic의 최고 성능 AI 모델'),
('Claude-3-Sonnet', 'Anthropic', 'Large Language Model', 'Anthropic의 균형잡힌 AI 모델'),
('Claude-3-Haiku', 'Anthropic', 'Large Language Model', 'Anthropic의 빠른 AI 모델'),
('Gemini', 'Google', 'Large Language Model', 'Google의 멀티모달 AI 모델'),
('Gemini-2.0', 'Google', 'Large Language Model', 'Google의 차세대 AI 모델'),
('PaLM-2', 'Google', 'Large Language Model', 'Google의 대규모 언어 모델'),
('Llama-3-70b', 'Meta', 'Large Language Model', 'Meta의 오픈소스 대용량 모델'),
('Llama-3-8b', 'Meta', 'Large Language Model', 'Meta의 경량 오픈소스 모델'),
('Cohere Command', 'Cohere', 'Large Language Model', 'Cohere의 기업용 AI 모델'); 