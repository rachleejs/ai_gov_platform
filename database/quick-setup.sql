-- 빠른 설정: 필수 테이블들만 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. 사용자 테이블 (간단 버전)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT UNIQUE,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AI 모델 테이블 (간단 버전)
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model_type TEXT NOT NULL,
    description TEXT,
    version TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 심리학적 평가 결과 테이블
CREATE TABLE IF NOT EXISTS psychological_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    model_name TEXT,
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_score INTEGER NOT NULL DEFAULT 0,
    percentage INTEGER NOT NULL DEFAULT 0,
    grade TEXT NOT NULL DEFAULT 'F',
    details TEXT DEFAULT '',
    user_friendly_summary TEXT DEFAULT '',
    evaluation_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 기본 AI 모델 데이터 삽입
INSERT INTO ai_models (id, name, provider, model_type, description, version) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'GPT-4 Turbo', 'OpenAI', 'LLM', 'Advanced language model', 'gpt-4-turbo'),
('550e8400-e29b-41d4-a716-446655440001', 'Claude 3 Opus', 'Anthropic', 'LLM', 'Advanced AI assistant', 'claude-3-opus'),
('550e8400-e29b-41d4-a716-446655440002', 'Gemini 2.0 Flash', 'Google', 'LLM', 'Fast multimodal AI', 'gemini-2.0-flash')
ON CONFLICT (id) DO NOTHING;

-- 5. RLS 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychological_evaluations ENABLE ROW LEVEL SECURITY;

-- 6. 기본 정책 (모든 사용자가 읽을 수 있게)
CREATE POLICY "Public read access for ai_models" ON ai_models FOR SELECT USING (true);
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can insert own psychological evaluations" ON psychological_evaluations 
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can view own psychological evaluations" ON psychological_evaluations 
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- 7. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_psychological_evaluations_model_id ON psychological_evaluations(model_id);
CREATE INDEX IF NOT EXISTS idx_psychological_evaluations_user_id ON psychological_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_psychological_evaluations_created_at ON psychological_evaluations(created_at DESC);

-- 8. 완료 메시지
SELECT 'Database setup complete! 🚀' AS status;
SELECT COUNT(*) as ai_models_count FROM ai_models;
SELECT COUNT(*) as psychological_evaluations_count FROM psychological_evaluations;