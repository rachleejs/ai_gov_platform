# External Evaluation Frameworks (Minimal)

이 디렉토리는 외부 평가 프레임워크의 최소한의 구조만 포함하고 있습니다. 실제 사용을 위해서는 각 프레임워크를 별도로 설치해야 합니다.

## 포함된 프레임워크

### 1. OpenAI Evals
- **설치 방법**: `pip install evals`
- **공식 문서**: [OpenAI Evals GitHub](https://github.com/openai/evals)

### 2. Hugging Face Evaluate
- **설치 방법**: `pip install evaluate transformers datasets`
- **공식 문서**: [Hugging Face Evaluate](https://huggingface.co/docs/evaluate/index)

### 3. LM Evaluation Harness
- **설치 방법**: `pip install lm-eval`
- **공식 문서**: [LM Evaluation Harness GitHub](https://github.com/EleutherAI/lm-evaluation-harness)

### 4. BIG-bench
- **설치 방법**: `pip install bigbench` (현재 Python 3.13과 호환성 이슈 있음)
- **공식 문서**: [BIG-bench GitHub](https://github.com/google/BIG-bench)

## 사용 방법

실제 평가를 위해서는 다음 단계를 따르세요:

1. 가상환경 활성화: `source .venv/bin/activate`
2. 필요한 프레임워크 설치: `pip install evals evaluate lm-eval`
3. API를 통해 평가 요청

## 참고 사항

원본 프레임워크 파일은 용량이 매우 크기 때문에 이 저장소에서는 최소한의 구조만 제공합니다. 전체 기능을 사용하려면 공식 저장소에서 설치하세요.
