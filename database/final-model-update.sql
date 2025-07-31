-- 최종 모델명 업데이트 (사용자의 실제 사용 모델)

-- 1. 현재 모델 상태 확인
SELECT 'Current models before final update:' as info;
SELECT id, name, provider FROM ai_models ORDER BY name;

-- 2. 사용자의 정확한 모델명으로 최종 업데이트
UPDATE ai_models SET name = 'GPT-4-Turbo', provider = 'OpenAI' 
WHERE id = 'cb7d2bb8-049c-4271-99a2-bffedebe2487';

UPDATE ai_models SET name = 'Claude-3-Opus', provider = 'Anthropic' 
WHERE id = '603d268f-d984-43b6-a85e-445bdd955061';

UPDATE ai_models SET name = 'Gemini-2.0-Flash', provider = 'Google' 
WHERE id = '3e72f00e-b450-4dff-812e-a013c4cca457';

-- 3. 최종 확인
SELECT 'Final models after update:' as info;
SELECT id, name, provider FROM ai_models ORDER BY name;

-- 4. 모든 기존 평가 결과 삭제 (새로운 설정으로 다시 시작)
DELETE FROM educational_quality_evaluations;

SELECT 'All models updated to user original names!' as status;
SELECT 'Ready for testing with: GPT-4-Turbo, Claude-3-Opus, Gemini-2.0-Flash' as ready; 