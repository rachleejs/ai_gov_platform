# AI 거버넌스 플랫폼 프로젝트 구조

이 문서는 AI 거버넌스 플랫폼의 폴더 및 파일 구조를 설명합니다.

## 최상위 디렉토리

```
ai-governance-platform/
├── app/                    # Next.js 애플리케이션 소스 코드
├── database/               # 데이터베이스 스키마 및 설정 파일
├── docs/                   # 프로젝트 문서
├── evaluation-results/     # 평가 결과 파일 저장 디렉토리
├── external_frameworks/    # 외부 평가 프레임워크 (참조용)
├── external_frameworks_minimal/ # 외부 프레임워크 최소 구조
├── lib/                    # 공통 라이브러리 및 유틸리티
├── scripts/                # 유틸리티 스크립트
├── .env.local              # 로컬 환경 변수 (Git에서 제외)
├── .gitignore              # Git 제외 파일 목록
├── next-env.d.ts           # Next.js TypeScript 정의
├── package.json            # Node.js 의존성 정의
├── postcss.config.js       # PostCSS 설정
├── PROJECT_STRUCTURE.md    # 이 문서
├── README.md               # 프로젝트 개요 및 설명
├── requirements.txt        # Python 의존성 목록
└── tailwind.config.js      # Tailwind CSS 설정
```

## 주요 디렉토리 상세 설명

### app/ - Next.js 애플리케이션

```
app/
├── add-custom/            # 커스텀 모델 추가 페이지
├── api/                   # API 라우트
│   ├── evaluation/        # 평가 관련 API
│   ├── models/            # 모델 관련 API
│   └── ...
├── auth/                  # 인증 관련 페이지
├── components/            # 공통 컴포넌트
├── contexts/              # React 컨텍스트
├── governance-framework/  # 거버넌스 프레임워크 페이지
│   └── evaluations/       # 평가 관련 페이지
├── i18n/                  # 국제화 리소스
├── layout.tsx             # 레이아웃 컴포넌트
├── main-dashboard/        # 메인 대시보드 페이지
├── model-comparison/      # 모델 비교 페이지
└── page.tsx               # 메인 페이지
```

### lib/ - 공통 라이브러리

```
lib/
├── database.ts            # 데이터베이스 연결 유틸리티
├── deepMetricsMapping.ts  # 심층 평가 지표 매핑
├── dynamicEvaluationEngine.ts # 동적 평가 엔진
├── evaluationMetrics.ts   # 평가 지표 정의
├── evaluationTemplates.ts # 평가 템플릿 정의
├── fonts/                 # 폰트 설정
├── hooks/                 # React 커스텀 훅
├── huggingfaceEvaluator.ts # Hugging Face 평가 통합
├── modelApi.ts            # 모델 API 연동
├── openaiEvalsIntegration.ts # OpenAI Evals 통합
├── psychologicalEvaluator.ts # 심리학적 평가 도구
└── supabase.ts            # Supabase 클라이언트
```

### database/ - 데이터베이스 관련

```
database/
├── create-deep-metrics-tables.sql # 심층 평가 테이블 생성
├── schema.sql             # 기본 스키마 정의
└── ...                    # 기타 SQL 스크립트
```

### scripts/ - 유틸리티 스크립트

```
scripts/
├── deepteam-security-evaluation.py # 보안 평가 스크립트
├── deploy-db.js           # 데이터베이스 배포 스크립트
├── real-deep-evaluation.py # 심층 평가 실행 스크립트
├── run-deep-evaluation.py # 심층 평가 실행 스크립트
├── setup-external-evaluators.sh # 외부 평가자 설정 스크립트
└── sync-keywords.js       # 키워드 동기화 스크립트
```

### evaluation-results/ - 평가 결과

```
evaluation-results/
├── samples/               # 샘플 평가 결과 파일
└── README.md              # 평가 결과 설명
```

### external_frameworks_minimal/ - 외부 프레임워크 최소 구조

```
external_frameworks_minimal/
├── big_bench/             # BIG-bench 최소 구조
├── huggingface_evaluate/  # Hugging Face Evaluate 최소 구조
├── lm_eval_harness/       # LM Evaluation Harness 최소 구조
├── openai_evals/          # OpenAI Evals 최소 구조
├── README.md              # 설명 문서
└── requirements.txt       # 의존성 목록
```

## 개발 환경 설정

### Node.js 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### Python 가상환경

```bash
# 가상환경 생성 및 활성화
python3 -m venv .venv
source .venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

## 데이터베이스 설정

Supabase를 사용하여 데이터베이스를 설정합니다. 자세한 내용은 `database/schema.sql` 파일을 참조하세요.

## 환경 변수

`.env.local` 파일에 다음 환경 변수를 설정해야 합니다:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_gemini_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```
