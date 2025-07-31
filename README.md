# AI 거버넌스 플랫폼

## 개요
AI 시스템의 윤리적, 기술적 안전성을 종합적으로 평가하는 플랫폼입니다.

## 🆕 최신 업데이트: 동적 평가 시스템 & 초등교육 품질평가

### 🎯 동적 템플릿 기반 평가 시스템 (NEW!)
- **템플릿 기반 평가**: 미리 정의된 평가 템플릿으로 코드 수정 없이 새로운 평가 지표 추가 가능
- **4가지 핵심 템플릿**:
  - **독해력 평가**: 텍스트 이해도, 추론 능력, 표현력 종합 평가
  - **창의적 글쓰기**: 창의성, 서사 구조, 언어 사용 능력 측정
  - **논리적 사고**: 논리적 타당성, 문제 해결, 추론 명확성 평가
  - **언어 분석**: 문법 정확성, 어휘 풍부성, 문체 변화 분석
- **실시간 평가 실행**: 템플릿 선택 → 모델 선택 → 즉시 평가
- **확장 가능한 구조**: 새로운 평가 템플릿 추가 및 커스터마이징 지원

### 📚 초등교육 품질평가 (Edu-sLLM-Quality)
- **실제 LLM 모델 연동**: OpenAI, Anthropic, Google, HuggingFace API 지원
- **3대 평가 지표**: 사실성, 정확성, 구체성 기준 종합 평가
- **교육 도메인 특화**: 초등 교육과정에 맞춘 평가 알고리즘
- **실시간 평가**: 모델 선택, 학년/과목별 맞춤 평가

### 평가 체계

#### 1. 사실성 평가 (Factuality)
- **임베딩 유사도**: 참조 답안과의 의미적 유사도
- **참조 중복도**: 핵심 키워드 포함 정도
- **사실 검증**: 핵심 용어 및 수치 정확성
- **신뢰도 분석**: 확신도 및 구체성 평가

#### 2. 정확성 평가 (Accuracy)
- **내용 정확도**: 참조 답안과의 내용 일치도
- **오류 비율**: 명백한 오류 탐지
- **교과서 일치도**: 교육과정 표준 용어 사용
- **학습 표준 준수도**: 학년별 적절성

#### 3. 구체성 평가 (Specificity)
- **세부 수준**: 설명의 단계별 상세함
- **학습 목표 일치도**: 교육 목표와의 정합성
- **학생 적합성**: 학년 수준에 맞는 설명
- **설명 품질**: 논리적 구조와 이해도

## 🚀 설치 및 설정

### 1. 환경 변수 설정

`.env.local` 파일에 다음 설정을 추가하세요:

```bash
# Database (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Model API Keys (선택사항 - 없으면 시뮬레이션 모드로 동작)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_gemini_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

### 2. 데이터베이스 설정

Supabase Dashboard에서 다음 SQL을 실행하여 테이블을 생성하세요:

```sql
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

-- 인덱스 생성
CREATE INDEX idx_educational_quality_evaluations_model_id ON educational_quality_evaluations(model_id);
CREATE INDEX idx_educational_quality_evaluations_grade_level ON educational_quality_evaluations(grade_level);
CREATE INDEX idx_educational_quality_evaluations_subject ON educational_quality_evaluations(subject);
CREATE INDEX idx_educational_quality_evaluations_created_at ON educational_quality_evaluations(created_at);

-- RLS 정책
ALTER TABLE educational_quality_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view educational quality evaluations" ON educational_quality_evaluations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert educational quality evaluations" ON educational_quality_evaluations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their educational quality evaluations" ON educational_quality_evaluations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 트리거
CREATE TRIGGER set_updated_at_educational_quality_evaluations
    BEFORE UPDATE ON educational_quality_evaluations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### 3. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

## 📊 사용법

### 🎯 동적 템플릿 기반 평가 실행

1. **커스텀 설정** 페이지 접속 (`/evaluation-data`)
2. **템플릿 평가 시작** 버튼 클릭
3. 평가 설정:
   - **카테고리 선택**: 인지적 사고, 창의적 사고, 논리적 사고, 언어 분석
   - **템플릿 선택**: 원하는 평가 템플릿 클릭 (독해력, 창의적 글쓰기 등)
   - **모델 선택**: 평가할 AI 모델 선택
4. **평가 시작** 버튼 클릭
5. 실시간 결과 확인:
   - 총점 및 등급
   - 세부 지표별 점수
   - 질문별 모델 응답 분석

### 📚 초등교육 품질평가 실행

1. **거버넌스 프레임워크** 페이지 접속
2. **초등교육 품질평가 (Edu-sLLM-Quality)** 카드 클릭
3. 평가 설정:
   - 모델 선택 (등록된 AI 모델 중 선택)
   - 학년 선택 (1-6학년)
   - 과목 선택 (수학, 국어, 과학, 사회, 영어)
4. **평가 시작** 버튼 클릭
5. 결과 확인 및 분석

### API 사용

#### 동적 평가 시스템 API

```javascript
// 사용 가능한 템플릿 조회
const templates = await fetch('/api/evaluation/dynamic');

// 동적 평가 실행
const response = await fetch('/api/evaluation/dynamic', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelId: 'your-model-id',
    templateId: 'reading_comprehension' // 또는 creative_writing, logical_reasoning, linguistic_analysis
  })
});

// 평가 결과 예시
const result = await response.json();
console.log(result.data.totalScore); // 총점
console.log(result.data.grade); // 등급
console.log(result.data.detailedScores); // 세부 점수
```

#### 초등교육 품질평가 API

```javascript
// 평가 실행
const response = await fetch('/api/evaluation/educational-quality', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelId: 'your-model-id',
    gradeLevel: '3',
    subject: 'math'
  })
});

// 결과 조회
const results = await fetch('/api/evaluation/educational-quality?modelId=your-model-id');
```

## 🎯 지원 모델

### 실제 API 연동 지원
- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude-3-sonnet
- **Google**: Gemini-pro
- **HuggingFace**: 다양한 오픈소스 모델

### 폴백 시뮬레이션
API 키가 없거나 호출 실패시 자동으로 시뮬레이션 모드로 전환됩니다.

## 🔬 평가 알고리즘

### LLM Evaluation Framework 기반
- 원본 프레임워크: `/Users/ijisoo/Documents/model_evaluation/reference_projects/llm-evaluation-framework-main`
- 3가지 핵심 지표를 TypeScript로 재구현
- 한국어 교육과정에 특화된 평가 로직

### 평가 과정
1. **모델 호출**: 선택한 모델에 교육용 질문 전송
2. **응답 수집**: 각 질문별 모델 응답 취합
3. **다차원 평가**: 사실성, 정확성, 구체성 개별 평가
4. **종합 점수**: 가중평균을 통한 최종 점수 산출
5. **상세 분석**: 세부 지표별 점수 및 개선 방향 제시

## 📈 성능 지표

### 평가 기준
- **우수**: 90점 이상
- **양호**: 80-89점
- **보통**: 70-79점
- **개선필요**: 70점 미만

### 실시간 통계
- 모델별 평가 현황
- 과목별 성능 비교
- 학년별 적합성 분석
- 시간대별 성능 변화

## 🔧 기술 스택

### Frontend
- **Next.js 14**: React 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **React Hooks**: 상태 관리

### Backend
- **Next.js API Routes**: 서버리스 API
- **Supabase**: 데이터베이스 및 인증
- **PostgreSQL**: 데이터 저장

### 평가 엔진
- **LLM API 연동**: 다중 제공업체 지원
- **평가 메트릭**: 교육 특화 알고리즘
- **실시간 처리**: 비동기 평가 처리

## 📁 프로젝트 구조

```
ai-governance-platform/
├── app/
│   ├── api/
│   │   └── evaluation/
│   │       ├── dynamic/
│   │       │   └── route.ts              # 동적 평가 API 엔드포인트
│   │       └── educational-quality/
│   │           └── route.ts              # 초등교육 평가 API
│   ├── governance-framework/
│   │   ├── template-evaluation/
│   │   │   └── page.tsx                  # 템플릿 기반 평가 UI
│   │   └── educational-quality-evaluation/
│   │       └── page.tsx                  # 초등교육 평가 UI
│   ├── evaluation-data/
│   │   └── page.tsx                      # 커스텀 설정 페이지
│   └── components/                       # 공통 컴포넌트
├── lib/
│   ├── modelApi.ts                      # 실제 모델 API 연동
│   ├── evaluationMetrics.ts             # 평가 지표 알고리즘
│   ├── evaluationTemplates.ts           # 동적 평가 템플릿 정의
│   ├── dynamicEvaluationEngine.ts       # 동적 평가 실행 엔진
│   └── supabase/                        # 데이터베이스 연결
├── database/
│   └── schema.sql                       # DB 스키마
└── README.md                            # 프로젝트 문서
```

## 🚨 주의사항

### API 사용량
- 실제 모델 API 사용시 비용 발생 가능
- 평가당 약 3-5개 질문으로 제한
- 토큰 사용량 모니터링 권장

### 데이터 보안
- 평가 결과는 데이터베이스에 저장
- API 키는 환경 변수로 관리
- RLS(Row Level Security) 적용

## 🤝 기여

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📜 라이센스

MIT License

---

**구현 완료**: 초등교육 품질평가 시스템이 완전히 통합되었습니다. 실제 모델 API 연동과 교육 도메인 특화 평가 알고리즘을 통해 AI 모델의 교육적 효과성을 종합적으로 평가할 수 있습니다.
