# 키워드 동기화 가이드

## 개요
이 문서는 Python 설정 파일(`customization.py`)에서 TypeScript 평가 엔진으로 키워드를 자동 동기화하는 방법을 설명합니다.

## 키워드 업데이트 방법

### 1. Python 파일에서 키워드 수정
```bash
# 원본 키워드 파일 수정
vi /Users/ijisoo/Documents/model_evaluation/evaluation/psychological_evaluation/framework/customization.py
```

### 2. 자동 동기화 실행
```bash
# AI 거버넌스 플랫폼 디렉토리에서 실행
cd /Users/ijisoo/Documents/Cursor/ai-governance-platform
npm run sync-keywords
```

### 3. 수동 실행 (대안)
```bash
node scripts/sync-keywords.js
```

## 키워드 카테고리 매핑

| Python 카테고리 | TypeScript 영역 | 설명 |
|---|---|---|
| `PIAGET_KEYWORDS` | `step_by_step_teaching` | 단계적 설명력 |
| `VYGOTSKY_KEYWORDS` | `collaborative_learning` | 협력학습 지도 |  
| `BANDURA_KEYWORDS` | `confidence_building` | 자신감 키우기 |
| `SOCIAL_IDENTITY_KEYWORDS` | `individual_recognition` | 개성 인정 |
| `INFORMATION_PROCESSING_KEYWORDS` | `clear_communication` | 명확한 소통 |

## 키워드 추가 예시

### Python 파일에서 키워드 추가:
```python
PIAGET_KEYWORDS = {
    "concrete_examples": ["예를 들어", "구체적으로", "실제로", "새로운키워드"],
    # ... 기타 키워드들
}
```

### 동기화 후 자동 반영:
```typescript
step_by_step_teaching: {
  name: "단계적 설명력",
  keywords: ["예를 들어", "구체적으로", "실제로", "새로운키워드", ...],
  // ... 자동으로 업데이트됨
}
```

## 주의사항

1. **백업**: 키워드 변경 전 중요한 데이터는 백업하세요
2. **테스트**: 동기화 후 평가 시스템이 정상 작동하는지 확인하세요
3. **대소문자**: 키워드는 대소문자를 구분합니다
4. **특수문자**: 따옴표나 특수문자가 포함된 키워드는 주의하세요

## 문제 해결

### 동기화 실패 시:
```bash
# 스크립트 권한 확인
ls -la scripts/sync-keywords.js

# 권한 부여
chmod +x scripts/sync-keywords.js

# 수동 실행으로 오류 확인
node scripts/sync-keywords.js
```

### 키워드가 반영되지 않을 때:
1. Python 파일 경로가 정확한지 확인
2. JSON 문법 오류가 없는지 확인
3. TypeScript 파일의 구조가 변경되지 않았는지 확인

## 자동화 옵션

### CI/CD 파이프라인에 추가:
```yaml
# .github/workflows/sync-keywords.yml
name: Sync Keywords
on:
  schedule:
    - cron: '0 9 * * *' # 매일 오전 9시
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Sync Keywords
        run: npm run sync-keywords
```

### Git Hook으로 자동 실행:
```bash
# .git/hooks/pre-commit
#!/bin/sh
npm run sync-keywords
git add lib/psychologicalEvaluator.ts
```

## 지원

문제가 있거나 새로운 기능이 필요한 경우 이슈를 등록해주세요.