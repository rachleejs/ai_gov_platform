-- 사용자의 기존 모델명으로 복구

-- 1. 현재 모델 상태 확인
SELECT 'Current models before restore:' as info;
SELECT id, name, provider FROM ai_models ORDER BY name;

-- 2. 사용자의 기존 모델명으로 업데이트
UPDATE ai_models SET name = 'GPT-4-Turbo', provider = 'OpenAI' 
WHERE id = 'cb7d2bb8-049c-4271-99a2-bffedebe2487';

UPDATE ai_models SET name = 'Claude-3-Opus', provider = 'Anthropic' 
WHERE id = '603d268f-d984-43b6-a85e-445bdd955061';

UPDATE ai_models SET name = 'Gemini-1.5-Flash', provider = 'Google' 
WHERE id = '3e72f00e-b450-4dff-812e-a013c4cca457';

-- 3. 복구 후 상태 확인
SELECT 'Models after restore:' as info;
SELECT id, name, provider FROM ai_models ORDER BY name;

SELECT 'Original model names restored!' as status; 