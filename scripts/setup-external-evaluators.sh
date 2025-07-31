#!/bin/bash

# 외부 평가 프레임워크 설정 스크립트

echo "🚀 Setting up external evaluation frameworks..."

# 외부 프레임워크 디렉토리 생성
mkdir -p external_frameworks
cd external_frameworks

# 1. OpenAI Evals
echo "📥 Setting up OpenAI Evals..."
if [ ! -d "openai_evals" ]; then
    git clone https://github.com/openai/evals.git openai_evals
    cd openai_evals
    pip install -e .
    cd ..
    echo "✅ OpenAI Evals installed"
else
    echo "⏭️ OpenAI Evals already exists"
fi

# 2. LM Evaluation Harness (EleutherAI)
echo "📥 Setting up LM Evaluation Harness..."
if [ ! -d "lm_eval_harness" ]; then
    git clone https://github.com/EleutherAI/lm-evaluation-harness.git lm_eval_harness
    cd lm_eval_harness
    pip install -e .
    cd ..
    echo "✅ LM Evaluation Harness installed"
else
    echo "⏭️ LM Evaluation Harness already exists"
fi

# 3. BIG-bench (Google)
echo "📥 Setting up BIG-bench..."
if [ ! -d "big_bench" ]; then
    git clone https://github.com/google/BIG-bench.git big_bench
    cd big_bench
    pip install -e .
    cd ..
    echo "✅ BIG-bench installed"
else
    echo "⏭️ BIG-bench already exists"
fi

# 4. HELM (Stanford)
echo "📥 Setting up HELM..."
if [ ! -d "helm" ]; then
    git clone https://github.com/stanford-crfm/helm.git helm
    cd helm
    pip install -e .
    cd ..
    echo "✅ HELM installed"
else
    echo "⏭️ HELM already exists"
fi

# 5. Hugging Face Evaluate (Python package)
echo "📥 Installing Hugging Face Evaluate..."
pip install evaluate

# 6. 기타 평가 도구들
echo "📥 Installing additional evaluation tools..."
pip install rouge-score
pip install sacrebleu
pip install bert-score

echo "🎉 All external evaluation frameworks have been set up!"
echo ""
echo "Available frameworks:"
echo "- OpenAI Evals: ./external_frameworks/openai_evals"
echo "- LM Evaluation Harness: ./external_frameworks/lm_eval_harness"  
echo "- BIG-bench: ./external_frameworks/big_bench"
echo "- HELM: ./external_frameworks/helm"
echo "- Hugging Face Evaluate: Python package"
echo ""
echo "💡 You can now use these frameworks in your evaluation system!" 