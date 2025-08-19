# External Evaluation Frameworks

이 디렉토리는 외부 평가 프레임워크를 포함하고 있습니다. 이 프레임워크들은 AI 모델의 성능을 다양한 측면에서 평가하는 데 사용됩니다.

## 포함된 프레임워크

### 1. OpenAI Evals
- **설명**: OpenAI에서 제공하는 LLM 평가 프레임워크
- **설치 방법**: `pip install evals`
- **공식 문서**: [OpenAI Evals GitHub](https://github.com/openai/evals)

### 2. Hugging Face Evaluate
- **설명**: Hugging Face에서 제공하는 NLP 모델 평가 라이브러리
- **설치 방법**: `pip install evaluate transformers datasets`
- **공식 문서**: [Hugging Face Evaluate](https://huggingface.co/docs/evaluate/index)

### 3. LM Evaluation Harness
- **설명**: EleutherAI에서 개발한 언어 모델 평가 프레임워크
- **설치 방법**: `pip install lm-eval`
- **공식 문서**: [LM Evaluation Harness GitHub](https://github.com/EleutherAI/lm-evaluation-harness)

### 4. BIG-bench
- **설명**: Google에서 개발한 대규모 언어 모델 벤치마크
- **설치 방법**: `pip install bigbench` (현재 Python 3.13과 호환성 이슈 있음)
- **공식 문서**: [BIG-bench GitHub](https://github.com/google/BIG-bench)

## 사용 방법

각 프레임워크는 다음과 같이 사용됩니다:

```javascript
// API 엔드포인트를 통한 평가 요청
const response = await fetch('/api/evaluation/external-frameworks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelId: 'your-model-id',
    framework: 'openai_evals', // 또는 'huggingface', 'lm_harness', 'big_bench'
    task: 'mmlu' // 프레임워크별 지원 태스크
  })
});
```

## 주의사항

- 외부 프레임워크 사용 시 실제 평가를 위해서는 각 프레임워크의 설치가 필요합니다.
- 각 프레임워크는 크기가 크므로, 실제 저장소에는 최소한의 파일만 포함하고 있습니다.
- 전체 프레임워크를 사용하려면 공식 저장소에서 설치하는 것을 권장합니다.
