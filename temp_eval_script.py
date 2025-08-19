
import evaluate
import json
import sys

def main():
    try:
        print(f"🤗 Loading Hugging Face metric: f1", file=sys.stderr)
        
        # 평가 지표 로드
        metric = evaluate.load("f1")
        print(f"✅ Successfully loaded f1", file=sys.stderr)

        # 데이터 준비
        predictions = ["Okay, I'm ready. What's your sample question? I'll do my best to answer it.\n"]
        references = ["Reference for: Okay, I'm ready. What's your sample question? I'll do my best to answer it.\n"]
        
        print(f"📊 Computing f1 for {len(predictions)} samples...", file=sys.stderr)

        # 지표별 특별 처리
        if "f1" in ["bleu", "sacrebleu"]:
            # BLEU 계열은 references가 리스트의 리스트여야 함
            formatted_refs = [[ref] for ref in references]
            results = metric.compute(predictions=predictions, references=formatted_refs)
        elif "f1" == "rouge":
            # ROUGE 평가
            results = metric.compute(predictions=predictions, references=references)
        elif "f1" == "bertscore":
            # BERTScore는 lang 파라미터 필요
            results = metric.compute(predictions=predictions, references=references, lang="en")
        elif "f1" in ["exact_match", "f1"]:
            # SQuAD 스타일 평가
            results = metric.compute(predictions=predictions, references=references)
        else:
            # 일반적인 경우
            results = metric.compute(predictions=predictions, references=references)
        
        print(f"📈 Raw results: {results}", file=sys.stderr)
        
        # 점수 추출 및 정규화
        score = 0
        if isinstance(results, dict):
            # 다양한 점수 키 시도
            if "score" in results:
                score = results["score"]
            elif "f1" in results:
                score = results["f1"]
            elif "bleu" in results:
                score = results["bleu"]
            elif "rouge1" in results:
                score = results["rouge1"]
            elif "rougeL" in results:
                score = results["rougeL"]
            elif "precision" in results and isinstance(results["precision"], list):
                score = results["precision"][0] if results["precision"] else 0
            elif "f1" in results:
                score = results["f1"][0] if isinstance(results["f1"], list) else results["f1"]
            elif "exact_match" in results:
                score = results["exact_match"]
            else:
                # 첫 번째 숫자 값 사용
                for value in results.values():
                    if isinstance(value, (int, float)):
                        score = value
                        break
                    elif isinstance(value, list) and len(value) > 0 and isinstance(value[0], (int, float)):
                        score = value[0]
                        break
        else:
            score = float(results) if results else 0
        
        # 0-100 스케일로 정규화
        if isinstance(score, (int, float)):
            if score <= 1.0:
                score = score * 100
            score = round(float(score), 2)
        else:
            score = 0
        
        print(f"🎯 Final score: {score}", file=sys.stderr)
        
        # 결과 출력 (JSON 형태)
        output = {
            "score": score,
            "metric_name": "f1",
            "raw_results": results,
            "predictions_count": len(predictions),
            "references_count": len(references)
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        print(f"❌ Error: {str(e)}", file=sys.stderr)
        error_output = {
            "score": 0,
            "metric_name": "f1",
            "error": str(e)
        }
        print(json.dumps(error_output))

if __name__ == "__main__":
    main()
