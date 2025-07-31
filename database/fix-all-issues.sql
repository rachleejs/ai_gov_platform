-- 모든 문제 해결을 위한 종합 SQL

-- 1. 현재 모델 상태 확인
SELECT 'Current models:' as info;
SELECT id, name, provider FROM ai_models ORDER BY name;

-- 2. 지정된 3개 UUID만 남기고 나머지 삭제
DELETE FROM ai_models 
WHERE id NOT IN (
    'cb7d2bb8-049c-4271-99a2-bffedebe2487',
    '603d268f-d984-43b6-a85e-445bdd955061', 
    '3e72f00e-b450-4dff-812e-a013c4cca457'
);

-- 3. 모델 이름 업데이트 (API 매핑을 위해)
UPDATE ai_models SET name = 'GPT-4', provider = 'OpenAI' 
WHERE id = 'cb7d2bb8-049c-4271-99a2-bffedebe2487';

UPDATE ai_models SET name = 'Claude-3', provider = 'Anthropic' 
WHERE id = '603d268f-d984-43b6-a85e-445bdd955061';

UPDATE ai_models SET name = 'Gemini-Pro', provider = 'Google' 
WHERE id = '3e72f00e-b450-4dff-812e-a013c4cca457';

-- 4. RLS 완전히 비활성화 (개발 환경용)
ALTER TABLE educational_quality_evaluations DISABLE ROW LEVEL SECURITY;

-- 5. 기존 정책들 모두 삭제
DROP POLICY IF EXISTS "Users can view educational quality evaluations" ON educational_quality_evaluations;
DROP POLICY IF EXISTS "Users can insert educational quality evaluations" ON educational_quality_evaluations;
DROP POLICY IF EXISTS "Users can update their educational quality evaluations" ON educational_quality_evaluations;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON educational_quality_evaluations;
DROP POLICY IF EXISTS "Allow all operations" ON educational_quality_evaluations;

-- 6. 테스트 데이터 삭제 (있다면)
DELETE FROM educational_quality_evaluations;

-- 7. 최종 확인
SELECT 'Final models:' as info;
SELECT id, name, provider FROM ai_models ORDER BY name;

SELECT 'RLS status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'educational_quality_evaluations';

SELECT 'Setup completed! RLS disabled, models cleaned up.' as status; 