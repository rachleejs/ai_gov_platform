// 동적 평가 실행 엔진

import { EvaluationTemplate, EvaluationPrompt, ScoringCriterion, EvaluationFunction } from './evaluationTemplates';
import { callModel } from './modelApi';

export interface DynamicEvaluationResult {
  templateId: string;
  templateName: string;
  modelId: string;
  totalScore: number;
  grade: string;
  detailedScores: Record<string, number>;
  promptResults: PromptResult[];
  timestamp: Date;
}

export interface PromptResult {
  promptId: string;
  question: string;
  modelResponse: string;
  scores: Record<string, number>;
  overallScore: number;
}

// 평가 함수들의 실제 구현
const EVALUATION_FUNCTIONS: Record<string, EvaluationFunction> = {
  // 독해력 평가 함수들
  evaluateComprehensionAccuracy: {
    name: '이해 정확도 평가',
    description: '텍스트 내용을 얼마나 정확히 이해했는지 평가',
    execute: (response: string, prompt: EvaluationPrompt): number => {
      let score = 50; // 기본 점수

      // 핵심 키워드 포함 여부 확인
      const keyTerms = extractKeyTermsFromPrompt(prompt.question);
      const mentionedTerms = keyTerms.filter(term => 
        response.toLowerCase().includes(term.toLowerCase())
      );
      score += (mentionedTerms.length / keyTerms.length) * 30;

      // 답변 길이와 구체성
      const sentences = response.split(/[.!?]/).filter(s => s.trim().length > 0);
      if (sentences.length >= 3) score += 10;
      if (sentences.length >= 5) score += 10;

      return Math.min(100, Math.max(0, score));
    }
  },

  evaluateInferenceAbility: {
    name: '추론 능력 평가',
    description: '글의 함의와 숨은 의미를 파악하는 능력 평가',
    execute: (response: string): number => {
      let score = 60;

      // 추론을 나타내는 표현들
      const inferenceMarkers = ['따라서', '그러므로', '이는', '이로 인해', '결과적으로', '의미하는 바는'];
      const usedMarkers = inferenceMarkers.filter(marker => response.includes(marker));
      score += usedMarkers.length * 8;

      // 구체적인 예시나 근거 제시
      if (response.includes('예를 들어') || response.includes('근거로는')) {
        score += 15;
      }

      return Math.min(100, Math.max(0, score));
    }
  },

  evaluateExpressionQuality: {
    name: '표현력 평가',
    description: '답변의 명확성과 논리성 평가',
    execute: (response: string): number => {
      let score = 70;

      // 문장 구조의 다양성
      const sentences = response.split(/[.!?]/).filter(s => s.trim().length > 0);
      const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
      
      if (avgLength > 20 && avgLength < 80) score += 15; // 적절한 문장 길이

      // 접속어 사용으로 논리성 확인
      const connectives = ['그리고', '하지만', '또한', '반면', '한편'];
      const usedConnectives = connectives.filter(conn => response.includes(conn));
      score += usedConnectives.length * 5;

      return Math.min(100, Math.max(0, score));
    }
  },

  // 창의성 평가 함수들
  evaluateCreativity: {
    name: '창의성 평가',
    description: '독창적이고 참신한 아이디어의 수준 평가',
    execute: (response: string): number => {
      let score = 50;

      // 독창적 어휘나 표현 사용
      const creativeWords = ['마법', '꿈', '환상', '신비', '기적', '놀라운', '상상'];
      const usedCreativeWords = creativeWords.filter(word => response.includes(word));
      score += usedCreativeWords.length * 8;

      // 감정적 표현과 묘사
      const emotionalExpressions = ['감동적', '아름다운', '따뜻한', '신나는', '슬픈', '기쁜'];
      const usedEmotions = emotionalExpressions.filter(expr => response.includes(expr));
      score += usedEmotions.length * 6;

      // 상세한 묘사
      if (response.length > 200) score += 15;
      if (response.length > 400) score += 10;

      return Math.min(100, Math.max(0, score));
    }
  },

  evaluateNarrativeStructure: {
    name: '서사 구조 평가',
    description: '이야기의 완성도와 구조적 안정성 평가',
    execute: (response: string): number => {
      let score = 60;

      // 시간 순서 표현
      const timeMarkers = ['처음에', '그 다음', '마지막에', '결국', '드디어'];
      const usedTimeMarkers = timeMarkers.filter(marker => response.includes(marker));
      score += usedTimeMarkers.length * 10;

      // 대화나 등장인물
      if (response.includes('"') || response.includes('"') || response.includes('"')) {
        score += 15; // 대화 포함
      }

      // 명확한 결말
      if (response.includes('끝') || response.includes('마침내') || response.includes('해피엔딩')) {
        score += 10;
      }

      return Math.min(100, Math.max(0, score));
    }
  },

  evaluateLanguageUse: {
    name: '언어 사용 평가',
    description: '어휘 선택과 문장 구성의 적절성 평가',
    execute: (response: string): number => {
      let score = 70;

      // 다양한 어휘 사용 (중복 단어 비율)
      const words = response.split(/\s+/);
      const uniqueWords = new Set(words);
      const vocabularyRichness = uniqueWords.size / words.length;
      score += vocabularyRichness * 20;

      // 적절한 문체 (존댓말, 반말 일관성)
      const formalMarkers = ['습니다', '였습니다', '입니다'];
      const informalMarkers = ['이야', '야', '지'];
      const hasFormal = formalMarkers.some(marker => response.includes(marker));
      const hasInformal = informalMarkers.some(marker => response.includes(marker));
      
      if (hasFormal && !hasInformal) score += 10; // 일관된 존댓말
      if (hasInformal && !hasFormal) score += 10; // 일관된 반말

      return Math.min(100, Math.max(0, score));
    }
  },

  // 논리적 사고 평가 함수들
  evaluateLogicalValidity: {
    name: '논리적 타당성 평가',
    description: '추론 과정의 논리적 정확성 평가',
    execute: (response: string, prompt: EvaluationPrompt): number => {
      let score = 60;

      // 참조 답안과의 일치도 (있는 경우)
      if (prompt.referenceAnswer) {
        if (response.toLowerCase().includes(prompt.referenceAnswer.toLowerCase())) {
          score += 25;
        }
      }

      // 논리적 연결어 사용
      const logicalConnectors = ['왜냐하면', '따라서', '그러므로', '결론적으로', '증명하면'];
      const usedConnectors = logicalConnectors.filter(conn => response.includes(conn));
      score += usedConnectors.length * 8;

      // 단계별 설명
      if (response.includes('첫째') || response.includes('둘째') || response.includes('1.') || response.includes('2.')) {
        score += 15;
      }

      return Math.min(100, Math.max(0, score));
    }
  },

  evaluateProblemSolving: {
    name: '문제 해결 평가',
    description: '체계적 문제 해결 접근법 평가',
    execute: (response: string): number => {
      let score = 50;

      // 문제 분석 단계
      if (response.includes('문제는') || response.includes('상황을 분석하면')) {
        score += 15;
      }

      // 해결 방법 제시
      if (response.includes('해결책') || response.includes('방법은') || response.includes('접근법')) {
        score += 15;
      }

      // 대안 검토
      if (response.includes('다른 방법') || response.includes('대안으로') || response.includes('또는')) {
        score += 10;
      }

      // 결론 도출
      if (response.includes('결론적으로') || response.includes('최종적으로')) {
        score += 10;
      }

      return Math.min(100, Math.max(0, score));
    }
  },

  evaluateReasoningClarity: {
    name: '추론 명확성 평가',
    description: '논리 전개의 명확성과 일관성 평가',
    execute: (response: string): number => {
      let score = 70;

      // 명확한 주장 제시
      if (response.includes('주장하는 바는') || response.includes('결론은')) {
        score += 15;
      }

      // 근거 제시
      if (response.includes('근거는') || response.includes('이유는') || response.includes('evidence')) {
        score += 10;
      }

      // 일관성 (모순되는 표현 확인)
      const contradictions = ['하지만 앞서', '반대로 말하면', '모순적으로'];
      const hasContradictions = contradictions.some(contra => response.includes(contra));
      if (!hasContradictions) score += 5;

      return Math.min(100, Math.max(0, score));
    }
  },

  // 언어 분석 평가 함수들
  evaluateGrammarAccuracy: {
    name: '문법 정확성 평가',
    description: '문법 규칙의 정확한 적용 평가',
    execute: (response: string): number => {
      let score = 80; // 기본적으로 높은 점수에서 시작

      // 일반적인 문법 오류 패턴 확인
      const grammarErrors = [
        /되요/g, // 돼요가 맞음
        /안되/g, // 안 돼가 맞음
        /못되/g, // 못 돼가 맞음
        /할께/g, // 할게가 맞음
      ];

      grammarErrors.forEach(errorPattern => {
        const matches = response.match(errorPattern);
        if (matches) {
          score -= matches.length * 5;
        }
      });

      return Math.min(100, Math.max(0, score));
    }
  },

  evaluateVocabularyRichness: {
    name: '어휘 풍부성 평가',
    description: '다양하고 적절한 어휘 사용 평가',
    execute: (response: string): number => {
      const words = response.split(/\s+/).filter(word => word.length > 1);
      const uniqueWords = new Set(words.map(word => word.toLowerCase()));
      
      // 어휘 다양성 점수 (고유 단어 / 전체 단어)
      const diversityRatio = uniqueWords.size / words.length;
      let score = diversityRatio * 80;

      // 고급 어휘 사용 확인
      const advancedVocab = ['탁월한', '혁신적인', '독창적인', '심도있는', '포괄적인'];
      const usedAdvanced = advancedVocab.filter(vocab => response.includes(vocab));
      score += usedAdvanced.length * 5;

      return Math.min(100, Math.max(0, score));
    }
  },

  evaluateStyleVariation: {
    name: '문체 변화 평가',
    description: '상황에 맞는 문체 선택과 변화 평가',
    execute: (response: string): number => {
      let score = 70;

      // 다양한 문장 형태 사용
      const questionMarks = (response.match(/\?/g) || []).length;
      const exclamations = (response.match(/!/g) || []).length;
      const periods = (response.match(/\./g) || []).length;

      if (questionMarks > 0) score += 10;
      if (exclamations > 0) score += 10;
      if (periods > 0) score += 5;

      // 문체 일관성
      const sentences = response.split(/[.!?]/).filter(s => s.trim().length > 0);
      const lengths = sentences.map(s => s.length);
      const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
      const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
      
      if (variance > 100) score += 5; // 문장 길이 변화가 있으면 가점

      return Math.min(100, Math.max(0, score));
    }
  }
};

// 보조 함수들
function extractKeyTermsFromPrompt(question: string): string[] {
  // 질문에서 핵심 키워드 추출
  const terms: string[] = [];
  
  // 중요한 명사나 키워드들을 추출하는 간단한 로직
  const words = question.split(/\s+/);
  const importantWords = words.filter(word => 
    word.length > 2 && 
    !['다음', '어떤', '어떻게', '무엇', '누구', '언제', '어디서', '왜', '해보세요', '설명하세요'].includes(word)
  );
  
  return importantWords.slice(0, 5); // 최대 5개까지만
}

// 메인 평가 실행 함수
export class DynamicEvaluationEngine {
  
  async executeEvaluation(
    template: EvaluationTemplate,
    modelId: string
  ): Promise<DynamicEvaluationResult> {
    console.log(`🎯 Starting dynamic evaluation: ${template.name} for model: ${modelId}`);
    
    const promptResults: PromptResult[] = [];
    
    // 각 프롬프트에 대해 순차적으로 평가 실행
    for (let i = 0; i < template.prompts.length; i++) {
      const prompt = template.prompts[i];
      
      console.log(`📝 Processing prompt ${i + 1}/${template.prompts.length}: ${prompt.question.substring(0, 50)}...`);
      
      // API 속도 제한 방지를 위한 딜레이
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      try {
        // 모델 응답 획득
        const modelResponse = await callModel(modelId, prompt.question);
        
        // 각 평가 기준에 따라 점수 계산
        const scores: Record<string, number> = {};
        let weightedSum = 0;
        let totalWeight = 0;
        
        for (const criterion of template.scoringCriteria) {
          const evaluationFunction = EVALUATION_FUNCTIONS[criterion.evaluationFunction];
          if (evaluationFunction) {
            const score = evaluationFunction.execute(modelResponse, prompt, criterion.parameters);
            scores[criterion.name] = score;
            weightedSum += score * criterion.weight;
            totalWeight += criterion.weight;
          } else {
            console.warn(`⚠️ Evaluation function not found: ${criterion.evaluationFunction}`);
            scores[criterion.name] = 50; // 기본 점수
            weightedSum += 50 * criterion.weight;
            totalWeight += criterion.weight;
          }
        }
        
        const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
        
        promptResults.push({
          promptId: prompt.id,
          question: prompt.question,
          modelResponse,
          scores,
          overallScore
        });
        
        console.log(`✅ Prompt ${i + 1} completed with overall score: ${overallScore}`);
        
      } catch (error) {
        console.error(`❌ Error processing prompt ${i + 1}:`, error);
        // 오류 발생시 기본 결과 추가
        promptResults.push({
          promptId: prompt.id,
          question: prompt.question,
          modelResponse: '평가 중 오류가 발생했습니다.',
          scores: template.scoringCriteria.reduce((acc, criterion) => {
            acc[criterion.name] = 0;
            return acc;
          }, {} as Record<string, number>),
          overallScore: 0
        });
      }
    }
    
    // 전체 점수 계산 (각 프롬프트의 가중 평균)
    let totalWeightedScore = 0;
    let totalPromptWeight = 0;
    
    promptResults.forEach((result, index) => {
      const prompt = template.prompts[index];
      totalWeightedScore += result.overallScore * prompt.weight;
      totalPromptWeight += prompt.weight;
    });
    
    const totalScore = totalPromptWeight > 0 ? Math.round(totalWeightedScore / totalPromptWeight) : 0;
    
    // 등급 계산
    const gradeIndex = Math.min(
      Math.floor((100 - totalScore) / 20), 
      template.resultFormat.gradeLabels.length - 1
    );
    const grade = template.resultFormat.gradeLabels[gradeIndex] || template.resultFormat.gradeLabels[0];
    
    // 상세 점수 계산 (각 평가 기준별 평균)
    const detailedScores: Record<string, number> = {};
    template.scoringCriteria.forEach(criterion => {
      let sum = 0;
      let count = 0;
      promptResults.forEach(result => {
        if (result.scores[criterion.name] !== undefined) {
          sum += result.scores[criterion.name];
          count++;
        }
      });
      detailedScores[criterion.name] = count > 0 ? Math.round(sum / count) : 0;
    });
    
    const result: DynamicEvaluationResult = {
      templateId: template.id,
      templateName: template.name,
      modelId,
      totalScore,
      grade,
      detailedScores,
      promptResults,
      timestamp: new Date()
    };
    
    console.log(`🎉 Dynamic evaluation completed: ${template.name}, Score: ${totalScore}, Grade: ${grade}`);
    
    return result;
  }
} 