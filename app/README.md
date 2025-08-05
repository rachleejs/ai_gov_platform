# AI Governance Platform - 폴더 구조

## 📁 메인 구조

### 🏠 메뉴 순서별 페이지
1. **`main-dashboard/`** - 메인 대시보드
   - `performance-monitoring/` - 성능 모니터링
2. **`leaderboard/`** - 리더보드
3. **`model-comparison/`** - 모델 비교
4. **`governance-framework/`** - 프레임워크
   - `evaluations/` - 평가 프레임워크들
     - `ai-ethics/` - AI 윤리 평가
     - `educational-quality/` - 교육 품질 평가
     - `psychological/` - 심리학적 평가
     - `external/` - 외부 프레임워크 평가
     - `scenario/` - 시나리오 평가
     - `template/` - 템플릿 평가
5. **`evaluation-data/`** - 커스텀 추가

### 🔐 인증 관련
- **`auth/`** - 인증 관련 페이지
  - `login/` - 로그인
  - `signup/` - 회원가입
  - `non-member-login/` - 비회원 로그인

### 🛠️ 공통 기능
- **`api/`** - API 엔드포인트
- **`components/`** - 재사용 가능한 컴포넌트
- **`contexts/`** - React 컨텍스트
- **`i18n/`** - 국제화 파일

### 📄 기타
- **`page.tsx`** - 메인 페이지 (홈)
- **`layout.tsx`** - 루트 레이아웃
- **`globals.css`** - 전역 스타일

## 🎯 폴더 구조의 장점

1. **메뉴 순서와 일치**: 사용자가 메뉴에서 보는 순서와 폴더 구조가 일치
2. **논리적 그룹핑**: 관련 기능들이 함께 그룹화됨
3. **확장성**: 새로운 평가 프레임워크나 기능을 쉽게 추가 가능
4. **유지보수성**: 명확한 구조로 코드 찾기와 수정이 용이 