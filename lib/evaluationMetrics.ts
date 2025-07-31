// LLM evaluation framework의 평가 지표 구현

interface EvaluationMetrics {
  factuality: {
    embedding_similarity: number;
    reference_overlap: number;
    fact_verification: number;
    confidence_analysis: number;
    factuality_score: number;
  };
  accuracy: {
    content_accuracy: number;
    error_free_ratio: number;
    curriculum_alignment: number;
    standard_compliance: number;
    accuracy_score: number;
  };
  specificity: {
    detail_level: number;
    objective_alignment: number;
    student_appropriateness: number;
    explanation_quality: number;
    specificity_score: number;
  };
}

// 텍스트 유사도 계산 (간단한 자카드 유사도)
function calculateJaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(text1.toLowerCase().split(/\s+/));
  const tokens2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// 키워드 중복도 계산
function calculateReferenceOverlap(modelOutput: string, reference: string): number {
  const modelTokens = modelOutput.toLowerCase().split(/\s+/);
  const refTokens = reference.toLowerCase().split(/\s+/);
  
  const modelSet = new Set(modelTokens);
  const refSet = new Set(refTokens);
  
  const commonTokens = [...modelSet].filter(token => refSet.has(token));
  const overlapRatio = refSet.size === 0 ? 0 : commonTokens.length / refSet.size;
  
  return Math.min(overlapRatio * 100, 100);
}

// 사실성 평가
export function evaluateFactuality(
  modelOutput: string, 
  reference: string
): EvaluationMetrics['factuality'] {
  // 1. 임베딩 유사도 (자카드 유사도로 근사)
  const embedding_similarity = calculateJaccardSimilarity(modelOutput, reference) * 100;
  
  // 2. 참조 중복도
  const reference_overlap = calculateReferenceOverlap(modelOutput, reference);
  
  // 3. 사실 검증 점수 (핵심 용어 포함 여부)
  const keyTerms = extractKeyTerms(reference);
  const factualTermsFound = keyTerms.filter(term => 
    modelOutput.toLowerCase().includes(term.toLowerCase())
  ).length;
  const fact_verification = keyTerms.length === 0 ? 100 : (factualTermsFound / keyTerms.length) * 100;
  
  // 4. 신뢰도 분석 (길이와 구체성 기반)
  const confidence_analysis = calculateConfidenceScore(modelOutput);
  
  // 종합 사실성 점수
  const factuality_score = Math.round(
    (embedding_similarity * 0.3 + 
     reference_overlap * 0.3 + 
     fact_verification * 0.3 + 
     confidence_analysis * 0.1)
  );
  
  return {
    embedding_similarity: Math.round(embedding_similarity),
    reference_overlap: Math.round(reference_overlap),
    fact_verification: Math.round(fact_verification),
    confidence_analysis: Math.round(confidence_analysis),
    factuality_score
  };
}

// 정확성 평가
export function evaluateAccuracy(
  modelOutput: string,
  reference: string,
  subject: string,
  gradeLevel: string
): EvaluationMetrics['accuracy'] {
  // 1. 내용 정확도 (참조 답안과의 일치도)
  const content_accuracy = calculateContentAccuracy(modelOutput, reference);
  
  // 2. 오류 비율 (명백한 오류 탐지)
  const error_free_ratio = calculateErrorFreeRatio(modelOutput, subject);
  
  // 3. 교과서 일치도 (교육과정 표준 용어 사용)
  const curriculum_alignment = calculateCurriculumAlignment(modelOutput, subject, gradeLevel);
  
  // 4. 학습 표준 준수도
  const standard_compliance = calculateStandardCompliance(modelOutput, gradeLevel);
  
  // 종합 정확성 점수
  const accuracy_score = Math.round(
    (content_accuracy * 0.4 + 
     error_free_ratio * 0.3 + 
     curriculum_alignment * 0.2 + 
     standard_compliance * 0.1)
  );
  
  return {
    content_accuracy: Math.round(content_accuracy),
    error_free_ratio: Math.round(error_free_ratio),
    curriculum_alignment: Math.round(curriculum_alignment),
    standard_compliance: Math.round(standard_compliance),
    accuracy_score
  };
}

// 구체성 평가
export function evaluateSpecificity(
  modelOutput: string,
  gradeLevel: string,
  subject: string
): EvaluationMetrics['specificity'] {
  // 1. 세부 수준 (설명의 상세함)
  const detail_level = calculateDetailLevel(modelOutput);
  
  // 2. 학습 목표 일치도
  const objective_alignment = calculateObjectiveAlignment(modelOutput, subject, gradeLevel);
  
  // 3. 학생 적합성 (학년 수준에 맞는 어휘와 설명)
  const student_appropriateness = calculateStudentAppropriateness(modelOutput, gradeLevel);
  
  // 4. 설명 품질
  const explanation_quality = calculateExplanationQuality(modelOutput);
  
  // 종합 구체성 점수
  const specificity_score = Math.round(
    (detail_level * 0.3 + 
     objective_alignment * 0.3 + 
     student_appropriateness * 0.2 + 
     explanation_quality * 0.2)
  );
  
  return {
    detail_level: Math.round(detail_level),
    objective_alignment: Math.round(objective_alignment),
    student_appropriateness: Math.round(student_appropriateness),
    explanation_quality: Math.round(explanation_quality),
    specificity_score
  };
}

// 보조 함수들

function extractKeyTerms(text: string): string[] {
  // 중요한 용어들 추출 (숫자, 단위, 전문용어)
  const terms: string[] = [];
  
  // 숫자와 단위
  const numberMatches = text.match(/\d+(\.\d+)?[도°cmkm%개]/g);
  if (numberMatches) terms.push(...numberMatches);
  
  // 수학 용어
  const mathTerms = ['삼각형', '직사각형', '둘레', '넓이', '각도', '변', '꼭짓점', '평행'];
  mathTerms.forEach(term => {
    if (text.includes(term)) terms.push(term);
  });
  
  return terms;
}

function calculateConfidenceScore(text: string): number {
  let score = 70; // 기본 점수
  
  // 확신을 나타내는 표현
  if (text.includes('항상') || text.includes('반드시') || text.includes('정확히')) {
    score += 15;
  }
  
  // 불확실성을 나타내는 표현
  if (text.includes('아마') || text.includes('대략') || text.includes('보통')) {
    score -= 10;
  }
  
  // 구체적인 수치나 공식 포함
  if (/\d+/.test(text) || text.includes('=') || text.includes('×') || text.includes('÷')) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateContentAccuracy(modelOutput: string, reference: string): number {
  // 핵심 내용 포함 여부 확인
  const referenceNumbers = reference.match(/\d+/g) || [];
  const outputNumbers = modelOutput.match(/\d+/g) || [];
  
  let numberAccuracy = 0;
  if (referenceNumbers.length > 0) {
    const correctNumbers = referenceNumbers.filter(num => outputNumbers.includes(num));
    numberAccuracy = (correctNumbers.length / referenceNumbers.length) * 100;
  } else {
    numberAccuracy = 100;
  }
  
  // 텍스트 유사도
  const textSimilarity = calculateJaccardSimilarity(modelOutput, reference) * 100;
  
  return (numberAccuracy * 0.6 + textSimilarity * 0.4);
}

function calculateErrorFreeRatio(text: string, subject: string): number {
  let score = 100;
  
  // 명백한 수학적 오류 확인
  if (subject === 'math') {
    // 잘못된 계산 패턴 확인 (간단한 예시)
    if (text.includes('17 + 25 = 43') || text.includes('삼각형의 내각의 합은 360도')) {
      score -= 30;
    }
  }
  
  // 맞춤법 오류 (간단한 검사)
  const commonErrors = ['으로써', '데로', '되요', '돼요'];
  commonErrors.forEach(error => {
    if (text.includes(error)) score -= 5;
  });
  
  return Math.max(0, score);
}

function calculateCurriculumAlignment(text: string, subject: string, gradeLevel: string): number {
  const grade = parseInt(gradeLevel);
  let score = 70; // 기본 점수
  
  if (subject === 'math') {
    if (grade <= 3) {
      // 초등 3학년 이하 적절한 용어
      const appropriateTerms = ['더하기', '빼기', '곱하기', '나누기', '일의 자리', '십의 자리'];
      const usedTerms = appropriateTerms.filter(term => text.includes(term));
      score += usedTerms.length * 5;
      
      // 너무 고급 용어 사용시 감점
      const advancedTerms = ['함수', '방정식', '미분', '적분'];
      const usedAdvanced = advancedTerms.filter(term => text.includes(term));
      score -= usedAdvanced.length * 10;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateStandardCompliance(text: string, gradeLevel: string): number {
  const grade = parseInt(gradeLevel);
  let score = 80;
  
  // 학년에 맞는 문장 길이
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
  
  if (grade <= 3 && avgSentenceLength > 50) {
    score -= 10; // 문장이 너무 길면 감점
  } else if (grade <= 3 && avgSentenceLength < 20) {
    score += 10; // 적절한 길이면 가점
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateDetailLevel(text: string): number {
  let score = 50; // 기본 점수
  
  // 설명의 단계별 진행
  const stepIndicators = ['첫 번째', '두 번째', '다음으로', '마지막으로', '따라서'];
  const usedSteps = stepIndicators.filter(indicator => text.includes(indicator));
  score += usedSteps.length * 8;
  
  // 구체적인 예시 포함
  if (text.includes('예를 들어') || text.includes('예시')) {
    score += 15;
  }
  
  // 공식이나 계산 과정 포함
  if (text.includes('=') || text.includes('계산') || text.includes('공식')) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateObjectiveAlignment(text: string, subject: string, gradeLevel: string): number {
  let score = 70;
  
  if (subject === 'math') {
    const grade = parseInt(gradeLevel);
    
    if (grade === 3) {
      // 3학년 학습 목표와 일치하는 내용
      const objectives = ['덧셈', '뺄셈', '곱셈', '나눗셈', '도형', '길이', '시간'];
      const matched = objectives.filter(obj => text.includes(obj));
      score += matched.length * 5;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateStudentAppropriateness(text: string, gradeLevel: string): number {
  const grade = parseInt(gradeLevel);
  let score = 80;
  
  // 어려운 한자어나 전문용어 사용 확인
  const difficultWords = ['수치', '계수', '알고리즘', '파라미터', '변수'];
  const usedDifficult = difficultWords.filter(word => text.includes(word));
  
  if (grade <= 3) {
    score -= usedDifficult.length * 10;
  }
  
  // 친근한 표현 사용
  const friendlyExpressions = ['해보겠습니다', '알아보겠습니다', '함께'];
  const usedFriendly = friendlyExpressions.filter(expr => text.includes(expr));
  score += usedFriendly.length * 5;
  
  return Math.max(0, Math.min(100, score));
}

function calculateExplanationQuality(text: string): number {
  let score = 70;
  
  // 논리적 구조 (원인-결과, 과정-결과)
  if (text.includes('왜냐하면') || text.includes('따라서') || text.includes('그러므로')) {
    score += 10;
  }
  
  // 명확한 결론
  if (text.includes('답은') || text.includes('결과는') || text.includes('정답')) {
    score += 10;
  }
  
  // 이해를 돕는 설명
  if (text.includes('쉽게 말하면') || text.includes('즉') || text.includes('다시 말해')) {
    score += 8;
  }
  
  return Math.max(0, Math.min(100, score));
}

// 종합 평가 함수
export function evaluateModelResponse(
  modelOutput: string,
  reference: string,
  subject: string,
  gradeLevel: string
): EvaluationMetrics {
  return {
    factuality: evaluateFactuality(modelOutput, reference),
    accuracy: evaluateAccuracy(modelOutput, reference, subject, gradeLevel),
    specificity: evaluateSpecificity(modelOutput, gradeLevel, subject)
  };
} 