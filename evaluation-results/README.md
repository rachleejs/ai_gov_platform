# 평가 결과 파일

이 디렉토리는 AI 모델 평가 결과 파일을 저장하는 곳입니다.

## 파일 명명 규칙

평가 결과 파일은 다음 형식으로 명명됩니다:
```
eval_{평가_카테고리}_{평가_유형}_{타임스탬프}.json
```

예시:
- `eval_accountability_quality_1755057988564.json`
- `eval_accountability_security_1754988323770.json`
- `eval_data-privacy_quality_1755058534794.json`

## 결과 파일 구조

각 JSON 파일은 다음과 같은 구조를 가집니다:

```json
{
  "modelId": "모델 ID",
  "modelName": "모델 이름",
  "category": "평가 카테고리",
  "type": "평가 유형",
  "timestamp": 1755057988564,
  "scores": {
    "overall": 85,
    "detailed": {
      "metric1": 80,
      "metric2": 90,
      ...
    }
  },
  "responses": [
    {
      "question": "질문 내용",
      "response": "모델 응답",
      "evaluation": "평가 결과"
    },
    ...
  ]
}
```

## 주의사항

- 이 디렉토리의 파일은 `.gitignore`에 의해 Git 저장소에서 제외됩니다.
- 실제 배포 시에는 데이터베이스에 결과를 저장하는 것을 권장합니다.
- 대용량 평가 결과는 별도의 저장소나 클라우드 스토리지에 보관하는 것이 좋습니다.
