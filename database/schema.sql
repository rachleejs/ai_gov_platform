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
    -- 버전 및 사양 정보
    version TEXT,
    context_window INTEGER DEFAULT 4096,
    max_tokens INTEGER DEFAULT 2048,
    -- API 관련 정보
    api_endpoint TEXT,
    api_key_required BOOLEAN DEFAULT true,
    authentication_type TEXT DEFAULT 'Bearer',
    -- 지원 기능
    supports_streaming BOOLEAN DEFAULT false,
    supported_formats JSONB DEFAULT '["text"]'::jsonb, -- ["text", "image", "audio"]
    -- 비용 정보 (토큰당 USD)
    input_cost_per_token DECIMAL(10,8),
    output_cost_per_token DECIMAL(10,8),
    -- 사용자 정의 모델 여부
    is_custom_model BOOLEAN DEFAULT false,
    custom_config JSONB, -- 사용자 정의 모델 설정
    -- 기본 정보
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

-- 5-1. 평가 지표 테이블 (사용자 정의)
CREATE TABLE evaluation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX idx_evaluations_model_id ON evaluations(model_id);
CREATE INDEX idx_evaluations_type ON evaluations(evaluation_type);
CREATE INDEX idx_audit_logs_model_id ON audit_logs(model_id);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_performance_metrics_model_id ON performance_metrics(model_id);
CREATE INDEX idx_performance_metrics_benchmark ON performance_metrics(benchmark_name);

-- 5-1. 평가 지표 테이블 (사용자 정의)
CREATE INDEX idx_evaluation_metrics_name ON evaluation_metrics(name);

-- 7. RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- 5-1. 평가 지표 테이블 (사용자 정의)
ALTER TABLE evaluation_metrics ENABLE ROW LEVEL SECURITY;

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

-- 5-1. 평가 지표 테이블 (사용자 정의)
CREATE POLICY "Evaluation metrics viewable by everyone" ON evaluation_metrics
    FOR SELECT USING (true);

-- 모든 사용자가(게스트 포함) 삽입 가능
CREATE POLICY "Anyone can insert evaluation metrics" ON evaluation_metrics
    FOR INSERT WITH CHECK (true);

-- 평가 지표 업데이트/삭제는 관리자만
CREATE POLICY "Admins can modify evaluation metrics" ON evaluation_metrics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete evaluation metrics" ON evaluation_metrics
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- AI 모델 삽입을 모든 사용자에게 허용 (게스트 포함)
CREATE POLICY "Anyone can insert AI models" ON ai_models
    FOR INSERT WITH CHECK (true);

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

-- 10. 기본 AI 모델 데이터 삽입 (필수 3개만)
INSERT INTO ai_models (
    name, provider, model_type, description, version, 
    context_window, max_tokens, api_endpoint, api_key_required,
    supports_streaming, supported_formats, 
    input_cost_per_token, output_cost_per_token, is_custom_model
) VALUES
(
    'GPT-4-turbo', 'OpenAI', 'Large Language Model', 
    'OpenAI 최신 대화형 AI 모델', '2024-04-09',
    128000, 4096, 'https://api.openai.com/v1/chat/completions', true,
    true, '["text", "image"]'::jsonb,
    0.00001, 0.00003, false
),
(
    'Claude-3-Opus', 'Anthropic', 'Large Language Model', 
    'Anthropic 최고 성능 대화형 AI', '20240229',
    200000, 4096, 'https://api.anthropic.com/v1/messages', true,
    true, '["text", "image"]'::jsonb,
    0.000015, 0.000075, false
),
(
    'Gemini-2-flash', 'Google', 'Large Language Model', 
    'Google 차세대 멀티모달 AI 모델', '2.0',
    1048576, 8192, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', true,
    false, '["text", "image", "audio", "video"]'::jsonb,
    0.000000375, 0.0000015, false
);

-- 11. 심리학적 평가 결과 테이블
CREATE TABLE psychological_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    model_name TEXT,
    scores JSONB NOT NULL,
    total_score INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    grade TEXT NOT NULL,
    details TEXT,
    user_friendly_summary TEXT,
    evaluation_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE psychological_evaluations ENABLE ROW LEVEL SECURITY;

-- 정책
CREATE POLICY "Psychological evaluations are viewable by owner" ON psychological_evaluations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own psychological evaluations" ON psychological_evaluations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own psychological evaluations" ON psychological_evaluations
    FOR UPDATE USING (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX idx_psychological_evaluations_model_id ON psychological_evaluations(model_id);
CREATE INDEX idx_psychological_evaluations_user_id ON psychological_evaluations(user_id);

-- 트리거
CREATE TRIGGER update_psychological_evaluations_updated_at
    BEFORE UPDATE ON psychological_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 

-- 초등교육 품질평가 결과 테이블
CREATE TABLE educational_quality_evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
    grade_level TEXT NOT NULL,
    subject TEXT NOT NULL,
    factuality_score INTEGER NOT NULL,
    accuracy_score INTEGER NOT NULL,
    specificity_score INTEGER NOT NULL,
    overall_score INTEGER NOT NULL,
    evaluation_details JSONB,
    evaluation_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초등교육 품질평가 결과 테이블 인덱스
CREATE INDEX idx_educational_quality_evaluations_model_id ON educational_quality_evaluations(model_id);
CREATE INDEX idx_educational_quality_evaluations_grade_level ON educational_quality_evaluations(grade_level);
CREATE INDEX idx_educational_quality_evaluations_subject ON educational_quality_evaluations(subject);
CREATE INDEX idx_educational_quality_evaluations_created_at ON educational_quality_evaluations(created_at);

-- 초등교육 품질평가 결과 테이블 RLS 정책
ALTER TABLE educational_quality_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view educational quality evaluations" ON educational_quality_evaluations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert educational quality evaluations" ON educational_quality_evaluations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their educational quality evaluations" ON educational_quality_evaluations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 초등교육 품질평가 결과 테이블 updated_at 트리거
CREATE TRIGGER set_updated_at_educational_quality_evaluations
    BEFORE UPDATE ON educational_quality_evaluations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at(); 