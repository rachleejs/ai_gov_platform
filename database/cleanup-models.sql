-- 모델 정리: 지정된 3개 UUID만 남기고 나머지 삭제

-- 1. 먼저 현재 모델들 확인
SELECT id, name, provider FROM ai_models ORDER BY created_at;

-- 2. 지정된 3개 UUID 외의 모델들 삭제
DELETE FROM ai_models 
WHERE id NOT IN (
    'cb7d2bb8-049c-4271-99a2-bffedebe2487',
    '603d268f-d984-43b6-a85e-445bdd955061', 
    '3e72f00e-b450-4dff-812e-a013c4cca457'
);

-- 3. 남은 모델들 확인
SELECT id, name, provider FROM ai_models ORDER BY name;

-- 4. 필요시 모델 정보 업데이트 (이름이 명확하지 않은 경우)
-- UPDATE ai_models SET name = 'GPT-4', provider = 'OpenAI' WHERE id = 'cb7d2bb8-049c-4271-99a2-bffedebe2487';
-- UPDATE ai_models SET name = 'Claude-3', provider = 'Anthropic' WHERE id = '603d268f-d984-43b6-a85e-445bdd955061';
-- UPDATE ai_models SET name = 'Gemini-Pro', provider = 'Google' WHERE id = '3e72f00e-b450-4dff-812e-a013c4cca457';

SELECT 'Model cleanup completed!' as status; 