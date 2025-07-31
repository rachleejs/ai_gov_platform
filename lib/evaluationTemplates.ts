// 동적 평가 시스템을 위한 템플릿 정의

export interface EvaluationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'cognitive' | 'creative' | 'logical' | 'linguistic' | 'custom';
  prompts: EvaluationPrompt[];
  scoringCriteria: ScoringCriterion[];
  resultFormat: ResultFormat;
}

export interface EvaluationPrompt {
  id: string;
  question: string;
  context?: string;
  expectedAnswerType: 'text' | 'number' | 'choice' | 'essay';
  referenceAnswer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  weight: number; // 가중치 (1-10)
}

export interface ScoringCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // 가중치 (0-1)
  evaluationFunction: string; // 평가 함수 이름
  parameters?: Record<string, any>;
}

export interface ResultFormat {
  scoreRange: [number, number]; // [최소값, 최대값]
  gradeLabels: string[]; // ['A', 'B', 'C', 'D', 'F'] 또는 ['우수', '보통', '미흡']
  detailedMetrics: string[]; // 상세 지표 이름들
}

// 미리 정의된 평가 템플릿들
export const PREDEFINED_TEMPLATES: EvaluationTemplate[] = [
  {
    id: 'reading_comprehension',
    name: '독해력 평가',
    description: '텍스트 이해도와 추론 능력을 평가합니다',
    category: 'cognitive',
    prompts: [
      {
        id: 'comprehension_1',
        question: '다음 글을 읽고 주요 내용을 요약해보세요.',
        context: '주어진 텍스트의 핵심 내용을 파악하는 능력을 평가합니다.',
        expectedAnswerType: 'essay',
        difficulty: 'medium',
        weight: 8
      },
      {
        id: 'comprehension_2', 
        question: '글의 주제와 관련하여 작가의 의도를 설명해보세요.',
        expectedAnswerType: 'essay',
        difficulty: 'hard',
        weight: 9
      }
    ],
    scoringCriteria: [
      {
        id: 'comprehension_accuracy',
        name: '이해 정확도',
        description: '텍스트 내용을 얼마나 정확히 이해했는지',
        weight: 0.4,
        evaluationFunction: 'evaluateComprehensionAccuracy'
      },
      {
        id: 'inference_ability',
        name: '추론 능력',
        description: '글의 함의와 숨은 의미를 파악하는 능력',
        weight: 0.3,
        evaluationFunction: 'evaluateInferenceAbility'
      },
      {
        id: 'expression_quality',
        name: '표현력',
        description: '답변의 명확성과 논리성',
        weight: 0.3,
        evaluationFunction: 'evaluateExpressionQuality'
      }
    ],
    resultFormat: {
      scoreRange: [0, 100],
      gradeLabels: ['A', 'B', 'C', 'D', 'F'],
      detailedMetrics: ['이해 정확도', '추론 능력', '표현력']
    }
  },
  {
    id: 'creative_writing',
    name: '창의적 글쓰기',
    description: '창의성과 문학적 표현 능력을 평가합니다',
    category: 'creative',
    prompts: [
      {
        id: 'creative_1',
        question: '주어진 단어들을 모두 사용하여 창의적인 이야기를 써보세요: 별, 시계, 열쇠, 편지',
        expectedAnswerType: 'essay',
        difficulty: 'medium',
        weight: 10
      },
      {
        id: 'creative_2',
        question: '평범한 일상 상황을 판타지 세계로 바꾸어 묘사해보세요.',
        expectedAnswerType: 'essay', 
        difficulty: 'hard',
        weight: 8
      }
    ],
    scoringCriteria: [
      {
        id: 'creativity_level',
        name: '창의성',
        description: '독창적이고 참신한 아이디어의 수준',
        weight: 0.4,
        evaluationFunction: 'evaluateCreativity'
      },
      {
        id: 'narrative_structure',
        name: '서사 구조',
        description: '이야기의 완성도와 구조적 안정성',
        weight: 0.3,
        evaluationFunction: 'evaluateNarrativeStructure'
      },
      {
        id: 'language_use',
        name: '언어 사용',
        description: '어휘 선택과 문장 구성의 적절성',
        weight: 0.3,
        evaluationFunction: 'evaluateLanguageUse'
      }
    ],
    resultFormat: {
      scoreRange: [0, 100],
      gradeLabels: ['매우 창의적', '창의적', '보통', '단조로움', '매우 단조로움'],
      detailedMetrics: ['창의성', '서사 구조', '언어 사용']
    }
  },
  {
    id: 'logical_reasoning',
    name: '논리적 사고',
    description: '논리적 추론과 문제 해결 능력을 평가합니다',
    category: 'logical',
    prompts: [
      {
        id: 'logic_1',
        question: '다음 전제가 주어졌을 때 올바른 결론을 도출해보세요: 모든 A는 B이다. C는 A이다.',
        expectedAnswerType: 'text',
        referenceAnswer: 'C는 B이다',
        difficulty: 'medium',
        weight: 7
      },
      {
        id: 'logic_2',
        question: '복잡한 문제를 단계별로 분석하고 해결 방법을 제시해보세요.',
        expectedAnswerType: 'essay',
        difficulty: 'hard',
        weight: 9
      }
    ],
    scoringCriteria: [
      {
        id: 'logical_validity',
        name: '논리적 타당성',
        description: '추론 과정의 논리적 정확성',
        weight: 0.5,
        evaluationFunction: 'evaluateLogicalValidity'
      },
      {
        id: 'problem_solving',
        name: '문제 해결',
        description: '체계적 문제 해결 접근법',
        weight: 0.3,
        evaluationFunction: 'evaluateProblemSolving'
      },
      {
        id: 'reasoning_clarity',
        name: '추론 명확성',
        description: '논리 전개의 명확성과 일관성',
        weight: 0.2,
        evaluationFunction: 'evaluateReasoningClarity'
      }
    ],
    resultFormat: {
      scoreRange: [0, 100],
      gradeLabels: ['논리적', '대체로 논리적', '보통', '다소 비논리적', '비논리적'],
      detailedMetrics: ['논리적 타당성', '문제 해결', '추론 명확성']
    }
  },
  {
    id: 'linguistic_analysis',
    name: '언어 분석',
    description: '언어적 정확성과 표현 능력을 평가합니다',
    category: 'linguistic',
    prompts: [
      {
        id: 'linguistic_1',
        question: '다음 문장의 문법적 오류를 찾아 수정해보세요.',
        expectedAnswerType: 'text',
        difficulty: 'medium',
        weight: 6
      },
      {
        id: 'linguistic_2',
        question: '같은 의미를 다양한 문체로 표현해보세요.',
        expectedAnswerType: 'essay',
        difficulty: 'medium',
        weight: 8
      }
    ],
    scoringCriteria: [
      {
        id: 'grammar_accuracy',
        name: '문법 정확성',
        description: '문법 규칙의 정확한 적용',
        weight: 0.4,
        evaluationFunction: 'evaluateGrammarAccuracy'
      },
      {
        id: 'vocabulary_richness',
        name: '어휘 풍부성',
        description: '다양하고 적절한 어휘 사용',
        weight: 0.3,
        evaluationFunction: 'evaluateVocabularyRichness'
      },
      {
        id: 'style_variation',
        name: '문체 변화',
        description: '상황에 맞는 문체 선택과 변화',
        weight: 0.3,
        evaluationFunction: 'evaluateStyleVariation'
      }
    ],
    resultFormat: {
      scoreRange: [0, 100],
      gradeLabels: ['우수', '양호', '보통', '미흡', '부족'],
      detailedMetrics: ['문법 정확성', '어휘 풍부성', '문체 변화']
    }
  }
];

// 평가 함수들 (실제 구현은 별도 파일에서)
export interface EvaluationFunction {
  name: string;
  description: string;
  execute: (response: string, prompt: EvaluationPrompt, parameters?: Record<string, any>) => number;
}

// 사용자 정의 평가지표 생성을 위한 헬퍼 함수
export function createCustomTemplate(
  name: string, 
  description: string,
  prompts: Omit<EvaluationPrompt, 'id'>[],
  criteria: Omit<ScoringCriterion, 'id'>[]
): EvaluationTemplate {
  return {
    id: `custom_${Date.now()}`,
    name,
    description,
    category: 'custom',
    prompts: prompts.map((prompt, index) => ({
      ...prompt,
      id: `prompt_${index}`
    })),
    scoringCriteria: criteria.map((criterion, index) => ({
      ...criterion,
      id: `criterion_${index}`
    })),
    resultFormat: {
      scoreRange: [0, 100],
      gradeLabels: ['우수', '양호', '보통', '미흡', '부족'],
      detailedMetrics: criteria.map(c => c.name)
    }
  };
}

// 템플릿 검색 및 필터링 함수
export function findTemplatesByCategory(category: EvaluationTemplate['category']): EvaluationTemplate[] {
  return PREDEFINED_TEMPLATES.filter(template => template.category === category);
}

export function getTemplateById(id: string): EvaluationTemplate | undefined {
  return PREDEFINED_TEMPLATES.find(template => template.id === id);
} 