-- AI 모델 테이블 확장 마이그레이션
-- 기존 ai_models 테이블에 새로운 컬럼들을 추가합니다

-- 1. 새로운 컬럼들 추가
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS context_window INTEGER DEFAULT 4096;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 2048;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS api_endpoint TEXT;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS api_key_required BOOLEAN DEFAULT true;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS authentication_type TEXT DEFAULT 'Bearer';
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS supports_streaming BOOLEAN DEFAULT false;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS supported_formats JSONB DEFAULT '["text"]'::jsonb;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS input_cost_per_token DECIMAL(10,8);
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS output_cost_per_token DECIMAL(10,8);
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS is_custom_model BOOLEAN DEFAULT false;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS custom_config JSONB;

-- 2. 기존 모델 데이터 업데이트
-- GPT-4-turbo 업데이트
UPDATE ai_models 
SET 
    version = '2024-04-09',
    context_window = 128000,
    max_tokens = 4096,
    api_endpoint = 'https://api.openai.com/v1/chat/completions',
    api_key_required = true,
    authentication_type = 'Bearer',
    supports_streaming = true,
    supported_formats = '["text", "image"]'::jsonb,
    input_cost_per_token = 0.00001,
    output_cost_per_token = 0.00003,
    is_custom_model = false
WHERE name = 'GPT-4-turbo' OR name LIKE '%GPT-4%turbo%';

-- Claude-3-Opus 업데이트
UPDATE ai_models 
SET 
    version = '20240229',
    context_window = 200000,
    max_tokens = 4096,
    api_endpoint = 'https://api.anthropic.com/v1/messages',
    api_key_required = true,
    authentication_type = 'Bearer',
    supports_streaming = true,
    supported_formats = '["text", "image"]'::jsonb,
    input_cost_per_token = 0.000015,
    output_cost_per_token = 0.000075,
    is_custom_model = false
WHERE name = 'Claude-3-Opus' OR name LIKE '%Claude%3%Opus%' OR name LIKE '%claude%opus%';

-- Gemini-2-flash 업데이트
UPDATE ai_models 
SET 
    version = '2.0',
    context_window = 1048576,
    max_tokens = 8192,
    api_endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    api_key_required = true,
    authentication_type = 'Bearer',
    supports_streaming = false,
    supported_formats = '["text", "image", "audio", "video"]'::jsonb,
    input_cost_per_token = 0.000000375,
    output_cost_per_token = 0.0000015,
    is_custom_model = false
WHERE name = 'Gemini-2-flash' OR name LIKE '%Gemini%2%flash%' OR name LIKE '%gemini%flash%';

-- 3. 기타 기존 모델들의 기본값 설정
UPDATE ai_models 
SET 
    version = COALESCE(version, '1.0'),
    context_window = COALESCE(context_window, 4096),
    max_tokens = COALESCE(max_tokens, 2048),
    api_key_required = COALESCE(api_key_required, true),
    authentication_type = COALESCE(authentication_type, 'Bearer'),
    supports_streaming = COALESCE(supports_streaming, false),
    supported_formats = COALESCE(supported_formats, '["text"]'::jsonb),
    is_custom_model = COALESCE(is_custom_model, false)
WHERE version IS NULL OR context_window IS NULL OR max_tokens IS NULL;

-- 4. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON ai_models(provider);
CREATE INDEX IF NOT EXISTS idx_ai_models_model_type ON ai_models(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_custom ON ai_models(is_custom_model);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_active ON ai_models(is_active);

-- 5. 업데이트 확인 쿼리 (실행 후 확인용)
-- SELECT name, provider, version, context_window, max_tokens, is_custom_model, supported_formats 
-- FROM ai_models 
-- ORDER BY name; 