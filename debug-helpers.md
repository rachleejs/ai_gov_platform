# 🔧 초등교육 품질평가 디버그 가이드

## 📋 현재 확인된 문제들

### 1. 평가가 너무 빨리 실행되는 문제
- **원인**: 실제 API 키가 없거나 모델 ID가 맞지 않아서 시뮬레이션 모드로 실행
- **해결**: API 키 확인 및 지연 시간 추가

### 2. 데이터베이스 저장 실패 문제
- **원인**: Supabase 테이블이 생성되지 않았거나 권한 문제
- **해결**: 테이블 생성 및 RLS 정책 확인

## 🔍 디버그 단계

### Step 1: API 키 확인
`.env.local` 파일에서 다음 확인:
```bash
# 실제 API 키가 설정되어 있는지 확인
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AI...
```

### Step 2: 모델 ID 확인
Supabase에서 `ai_models` 테이블 확인:
```sql
SELECT * FROM ai_models;
```

### Step 3: 테이블 존재 확인
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'educational_quality_evaluations';
```

### Step 4: 브라우저 콘솔 확인
개발자 도구 → Network 탭에서 API 호출 상태 확인

### Step 5: 서버 로그 확인
터미널에서 다음 로그 메시지 확인:
- `🚀 Calling model: ...`
- `🔑 No API key found...` (문제)
- `✅ API key found...` (정상)
- `💾 Saving evaluation result...`
- `❌ Error saving...` (문제)
- `✅ Successfully saved...` (정상)

## 🎯 자주 발생하는 문제와 해결책

### Q1: 평가가 1-2초만에 끝나요
**A**: 시뮬레이션 모드로 실행되고 있습니다.
- API 키가 올바르게 설정되었는지 확인
- 모델 ID가 데이터베이스에 존재하는지 확인

### Q2: 데이터베이스에 결과가 저장되지 않아요
**A**: 테이블이나 권한 문제입니다.
- Supabase에서 테이블 생성 SQL 실행
- RLS 정책이 올바르게 설정되었는지 확인

### Q3: "Model not found" 에러가 나요
**A**: 모델 테이블에 데이터가 없습니다.
```sql
-- 샘플 모델 데이터 추가
INSERT INTO ai_models (name, provider, model_type) VALUES
('GPT-4', 'OpenAI', 'Large Language Model'),
('Claude-3', 'Anthropic', 'Large Language Model'),
('Gemini-Pro', 'Google', 'Large Language Model');
```

## 🔧 수동 테스트 방법

### 1. API 직접 호출 테스트
```bash
curl -X POST http://localhost:3000/api/evaluation/educational-quality \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "your-model-id",
    "gradeLevel": "3",
    "subject": "math"
  }'
```

### 2. 데이터베이스 직접 확인
```sql
-- 저장된 평가 결과 확인
SELECT * FROM educational_quality_evaluations 
ORDER BY created_at DESC 
LIMIT 5;
```

## 📊 모니터링 로그

정상 동작시 콘솔에 표시되는 로그:
```
🚀 Calling model: gpt-4
✅ API key found for openai, attempting real API call...
✅ Successfully called gpt-4 API
💾 Saving evaluation result to database...
✅ Successfully saved evaluation result: [...]
```

문제 발생시 콘솔에 표시되는 로그:
```
🚀 Calling model: gpt-4
🔑 No API key found for model: gpt-4, using fallback
🔄 Using fallback simulation for model: gpt-4
💾 Saving evaluation result to database...
❌ Error saving evaluation result: [에러 메시지]
``` 