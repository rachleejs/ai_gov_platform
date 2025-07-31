-- 수정된 데이터베이스 스키마 (정책 오류 해결)

-- 1. ai_models 테이블 생성
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT,
    model_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 샘플 모델 데이터 추가
INSERT INTO ai_models (name, provider, model_type) VALUES
('GPT-4', 'OpenAI', 'Large Language Model'),
('Claude-3', 'Anthropic', 'Large Language Model'),
('Gemini-Pro', 'Google', 'Large Language Model')
ON CONFLICT DO NOTHING;

-- 3. educational_quality_evaluations 테이블 생성
CREATE TABLE IF NOT EXISTS educational_quality_evaluations (
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

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_educational_quality_evaluations_model_id ON educational_quality_evaluations(model_id);
CREATE INDEX IF NOT EXISTS idx_educational_quality_evaluations_grade_level ON educational_quality_evaluations(grade_level);
CREATE INDEX IF NOT EXISTS idx_educational_quality_evaluations_subject ON educational_quality_evaluations(subject);
CREATE INDEX IF NOT EXISTS idx_educational_quality_evaluations_created_at ON educational_quality_evaluations(created_at);

-- 5. updated_at 자동 업데이트 함수 생성
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. updated_at 트리거 생성
DROP TRIGGER IF EXISTS set_updated_at_educational_quality_evaluations ON educational_quality_evaluations;
CREATE TRIGGER set_updated_at_educational_quality_evaluations
    BEFORE UPDATE ON educational_quality_evaluations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. RLS 활성화
ALTER TABLE educational_quality_evaluations ENABLE ROW LEVEL SECURITY;

-- 8. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view educational quality evaluations" ON educational_quality_evaluations;
DROP POLICY IF EXISTS "Users can insert educational quality evaluations" ON educational_quality_evaluations;
DROP POLICY IF EXISTS "Users can update their educational quality evaluations" ON educational_quality_evaluations;

-- 9. 새 정책 생성
CREATE POLICY "Users can view educational quality evaluations" ON educational_quality_evaluations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert educational quality evaluations" ON educational_quality_evaluations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their educational quality evaluations" ON educational_quality_evaluations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 10. 확인용 쿼리
SELECT 'Setup completed successfully!' as status; 