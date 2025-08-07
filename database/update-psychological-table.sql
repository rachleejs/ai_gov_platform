-- 심리학적 평가 테이블 업데이트
-- 누락된 컬럼들 추가 및 세부 정보 저장을 위한 구조 개선

-- 1. details 컬럼 추가 (기존 누락된 컬럼)
ALTER TABLE psychological_evaluations 
ADD COLUMN IF NOT EXISTS details TEXT;

-- 2. 모델명 저장을 위한 컬럼 추가 (조인 없이 빠른 조회용)
ALTER TABLE psychological_evaluations 
ADD COLUMN IF NOT EXISTS model_name TEXT;

-- 3. 세부 평가 데이터 저장을 위한 컬럼들 추가
ALTER TABLE psychological_evaluations 
ADD COLUMN IF NOT EXISTS evaluation_data JSONB; -- 질문과 응답 저장

-- 4. 사용자 친화적 결과 저장을 위한 컬럼 추가
ALTER TABLE psychological_evaluations 
ADD COLUMN IF NOT EXISTS user_friendly_summary TEXT; -- 일반인을 위한 요약

-- 5. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_psychological_evaluations_model_id ON psychological_evaluations(model_id);
CREATE INDEX IF NOT EXISTS idx_psychological_evaluations_user_id ON psychological_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_psychological_evaluations_created_at ON psychological_evaluations(created_at);

-- 6. 기존 데이터의 호환성을 위해 NULL 값들을 기본값으로 설정
UPDATE psychological_evaluations 
SET details = COALESCE(details, '평가 완료')
WHERE details IS NULL;

UPDATE psychological_evaluations 
SET model_name = COALESCE(model_name, 'Unknown Model')
WHERE model_name IS NULL;

UPDATE psychological_evaluations 
SET evaluation_data = COALESCE(evaluation_data, '{}'::jsonb)
WHERE evaluation_data IS NULL;

UPDATE psychological_evaluations 
SET user_friendly_summary = COALESCE(user_friendly_summary, '평가 결과를 확인하세요.')
WHERE user_friendly_summary IS NULL;

-- 7. 업데이트 완료 확인
SELECT 'psychological_evaluations 테이블 업데이트 완료' AS status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'psychological_evaluations' 
ORDER BY ordinal_position;