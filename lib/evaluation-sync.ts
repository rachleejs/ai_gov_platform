/**
 * 평가 결과 실시간 동기화를 위한 공통 유틸리티
 */

export interface EvaluationData {
  deepEvalScore?: number;     // Deep Eval (품질/윤리) 점수  
  deepTeamScore?: number;     // Deep Team (보안) 점수
  psychologyScore?: number;
  educationalQualityScore?: number;
  externalScore?: number;
}

export interface ModelEvaluationData {
  id: string;
  name: string;
  provider?: string;
  evaluations: EvaluationData;
}

/**
 * 모든 평가 API를 병렬로 호출하여 데이터를 가져옵니다
 */
export async function fetchAllEvaluationData(modelId: string): Promise<EvaluationData> {
  const evaluationPromises = [
    fetchDeepEvalScore(modelId),
    fetchDeepTeamScore(modelId),
    fetchPsychologyScore(modelId),
    fetchEducationalQualityScore(modelId),
    fetchExternalScore(modelId)
  ];

  try {
    const [deepEvalScore, deepTeamScore, psychologyScore, educationalQualityScore, externalScore] = 
      await Promise.all(evaluationPromises);

    return {
      deepEvalScore,
      deepTeamScore,
      psychologyScore,
      educationalQualityScore,
      externalScore
    };
  } catch (error) {
    console.error(`Error fetching evaluation data for model ${modelId}:`, error);
    return {};
  }
}

/**
 * 모든 모델에 대한 평가 데이터를 병렬로 가져옵니다
 */
export async function fetchAllModelsEvaluationData(models: any[]): Promise<ModelEvaluationData[]> {
  const modelPromises = models.map(async (model) => {
    const evaluations = await fetchAllEvaluationData(model.id);
    return {
      id: model.id,
      name: model.name,
      provider: model.provider,
      evaluations
    };
  });

  try {
    return await Promise.all(modelPromises);
  } catch (error) {
    console.error('Error fetching all models evaluation data:', error);
    return [];
  }
}



/**
 * 심리학적 평가 점수 가져오기
 */
async function fetchPsychologyScore(modelId: string): Promise<number> {
  try {
    const response = await fetch(`/api/evaluation/psychological?modelId=${modelId}`);
    if (response.ok) {
      const data = await response.json();
      return data?.percentage || 0;
    }
  } catch (error) {
    console.error(`Failed to fetch psychology score for model ${modelId}:`, error);
  }
  return 0;
}

/**
 * Deep Eval (품질/윤리) 평가 점수 가져오기
 */
async function fetchDeepEvalScore(modelId: string): Promise<number> {
  try {
    console.log(`🔍 fetchDeepEvalScore for modelId: ${modelId}`);
    // Deep Eval (quality) 결과 조회
    const historyResponse = await fetch(`/api/evaluation/deep-metrics/history?modelId=${modelId}&type=quality&limit=1`);
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log(`📊 Deep Eval API response:`, historyData);
      if (historyData.success && historyData.data && historyData.data.length > 0) {
        const latestEvaluation = historyData.data[0];
        
        // model_results를 직접 확인하고, 없으면 결과 내의 모델 키를 찾아보기
        if (latestEvaluation.model_results && latestEvaluation.model_results[modelId]) {
          const modelResults = latestEvaluation.model_results[modelId];
          if (modelResults.summary && modelResults.summary.overall_score) {
            return Math.round(modelResults.summary.overall_score);
          }
        } else if (latestEvaluation.results) {
          // results 객체에서 modelId 또는 변환된 키로 찾기
          const modelKey = getModelKeyFromId(modelId);
          console.log(`🔑 Deep Eval modelKey: ${modelKey} for modelId: ${modelId}`);
          
          // 직접 modelId로 찾기 (quality/ethics evaluation)
          if (latestEvaluation.results[modelId] && latestEvaluation.results[modelId].metrics) {
            // quality 평가를 위한 메트릭 검색
            const metrics = latestEvaluation.results[modelId].metrics;
            if (metrics.quality_overall?.score) {
              return Math.round(metrics.quality_overall.score);
            }
            // 다른 품질 관련 메트릭이 있다면 찾기
            const qualityMetrics = Object.values(metrics).filter((metric: any) => 
              metric.category === 'quality' || metric.evaluation_type === 'quality'
            );
            if (qualityMetrics.length > 0) {
              const avgScore = qualityMetrics.reduce((sum: number, metric: any) => sum + (metric.score || 0), 0) / qualityMetrics.length;
              return Math.round(avgScore);
            }
          }
          
          // 변환된 키로 찾기 (claude-3-opus -> claude)
          if (latestEvaluation.results[modelKey] && latestEvaluation.results[modelKey].metrics) {
            const metrics = latestEvaluation.results[modelKey].metrics;
            if (metrics.quality_overall?.score) {
              return Math.round(metrics.quality_overall.score);
            }
            // 다른 품질 관련 메트릭이 있다면 찾기
            const qualityMetrics = Object.values(metrics).filter((metric: any) => 
              metric.category === 'quality' || metric.evaluation_type === 'quality'
            );
            if (qualityMetrics.length > 0) {
              const avgScore = qualityMetrics.reduce((sum: number, metric: any) => sum + (metric.score || 0), 0) / qualityMetrics.length;
              return Math.round(avgScore);
            }
          }
          
          // summary에서 모델별 점수 찾기 (새로 추가)
          if (latestEvaluation.summary?.modelScores) {
            console.log(`📊 Deep Eval summary.modelScores:`, latestEvaluation.summary.modelScores);
            const modelScore = latestEvaluation.summary.modelScores[modelKey] || latestEvaluation.summary.modelScores[modelId];
            if (modelScore) {
              console.log(`✅ Deep Eval score found: ${modelScore} for model ${modelId} (key: ${modelKey})`);
              return Math.round(modelScore);
            }
          }
        }
      }
    }

    // 없으면 consolidated results에서 조회
    const consolidatedResponse = await fetch('/api/evaluation-results');
    if (consolidatedResponse.ok) {
      const consolidatedData = await consolidatedResponse.json();
      const modelKey = getModelKeyFromId(modelId);
      
      if (consolidatedData.results && consolidatedData.results[modelKey]) {
        const modelMetrics = consolidatedData.results[modelKey];
        const scores: number[] = [];
        
        // 모든 메트릭의 평균 점수 계산
        Object.values(modelMetrics).forEach((metricExamples: any) => {
          if (Array.isArray(metricExamples)) {
            metricExamples.forEach((example: any) => {
              if (example.score !== undefined) {
                scores.push(example.score * 100); // 0-1 scale을 0-100으로 변환
              }
            });
          }
        });
        
        if (scores.length > 0) {
          return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to fetch deep eval score for model ${modelId}:`, error);
  }
  return 0;
}

/**
 * Deep Team (보안) 평가 점수 가져오기
 */
async function fetchDeepTeamScore(modelId: string): Promise<number> {
  try {
    console.log(`🔍 fetchDeepTeamScore for modelId: ${modelId}`);
    // Deep Team (security) 결과 조회
    const historyResponse = await fetch(`/api/evaluation/deep-metrics/history?modelId=${modelId}&type=security&limit=1`);
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log(`🛡️ Deep Team API response:`, historyData);
      if (historyData.success && historyData.data && historyData.data.length > 0) {
        const latestEvaluation = historyData.data[0];
        
        // model_results를 직접 확인하고, 없으면 결과 내의 모델 키를 찾아보기
        if (latestEvaluation.model_results && latestEvaluation.model_results[modelId]) {
          const modelResults = latestEvaluation.model_results[modelId];
          if (modelResults.summary && modelResults.summary.overall_score) {
            return Math.round(modelResults.summary.overall_score);
          }
        } else if (latestEvaluation.results) {
          // results 객체에서 modelId 또는 변환된 키로 찾기
          const modelKey = getModelKeyFromId(modelId);
          console.log(`🔑 Deep Team modelKey: ${modelKey} for modelId: ${modelId}`);
          
          // 직접 modelId로 찾기
          if (latestEvaluation.results[modelId] && latestEvaluation.results[modelId].metrics?.security_overall?.score) {
            return Math.round(latestEvaluation.results[modelId].metrics.security_overall.score);
          }
          
          // 변환된 키로 찾기 (claude-3-opus -> claude)
          if (latestEvaluation.results[modelKey] && latestEvaluation.results[modelKey].metrics?.security_overall?.score) {
            return Math.round(latestEvaluation.results[modelKey].metrics.security_overall.score);
          }
          
          // summary에서 모델별 점수 찾기 (새로 추가)
          if (latestEvaluation.summary?.modelScores) {
            console.log(`🛡️ Deep Team summary.modelScores:`, latestEvaluation.summary.modelScores);
            const modelScore = latestEvaluation.summary.modelScores[modelKey] || latestEvaluation.summary.modelScores[modelId];
            if (modelScore) {
              console.log(`✅ Deep Team score found: ${modelScore} for model ${modelId} (key: ${modelKey})`);
              return Math.round(modelScore);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`Failed to fetch deep team score for model ${modelId}:`, error);
  }
  return 0;
}

/**
 * 모델 ID를 키로 변환하는 헬퍼 함수
 */
function getModelKeyFromId(modelId: string): string {
  // UUID 및 이전 형식 모두 지원하는 매핑
  const keyMap: { [key: string]: string } = {
    // 이전 형식 (호환성)
    'claude-3-opus': 'claude',
    'gpt-4-turbo': 'gpt', 
    'gemini-2-flash': 'gemini',
    // UUID 기반 매핑 (실제 모델 ID)
    '603d268f-d984-43b6-a85e-445bdd955061': 'claude', // Claude-3-Opus
    '3e72f00e-b450-4dff-812e-a013c4cca457': 'gemini', // Gemini-2.0-Flash
    'cb7d2bb8-049c-4271-99a2-bffedebe2487': 'gpt'     // GPT-4-Turbo
  };
  
  return keyMap[modelId] || modelId;
}

/**
 * 교육 품질 평가 점수 가져오기
 */
async function fetchEducationalQualityScore(modelId: string): Promise<number> {
  try {
    const response = await fetch(`/api/evaluation/educational-quality?modelId=${modelId}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return data[0].total_score || 0;
      }
    }
  } catch (error) {
    console.error(`Failed to fetch educational quality score for model ${modelId}:`, error);
  }
  return 0;
}

/**
 * 외부 프레임워크 평가 점수 가져오기
 */
async function fetchExternalScore(modelId: string): Promise<number> {
  try {
    const response = await fetch(`/api/evaluation/external-frameworks?modelId=${modelId}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const total = data.reduce((sum: number, item: any) => sum + (item.score || 0), 0);
        return Math.round(total / data.length);
      }
    }
  } catch (error) {
    console.error(`Failed to fetch external score for model ${modelId}:`, error);
  }
  return 0;
}

/**
 * 평가 완료 후 다른 페이지들에 브로드캐스트할 이벤트 발생
 */
export function broadcastEvaluationUpdate(modelId: string, evaluationType: string, data: any) {
  // Custom event를 사용하여 브라우저 내에서 페이지 간 통신
  const event = new CustomEvent('evaluationUpdate', {
    detail: {
      modelId,
      evaluationType,
      data,
      timestamp: new Date().toISOString()
    }
  });
  
  // 브라우저의 다른 탭이나 윈도우에도 전파하기 위해 localStorage 사용
  const updateData = {
    modelId,
    evaluationType,
    data,
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('evaluationUpdate', JSON.stringify(updateData));
  localStorage.removeItem('evaluationUpdate'); // 즉시 제거하여 이벤트 트리거
  
  // 현재 페이지 내에서의 이벤트 발생
  window.dispatchEvent(event);
}

/**
 * 평가 업데이트 이벤트를 수신하기 위한 훅
 * React Hook은 아니고, 단순히 이벤트 리스너를 설정하는 함수입니다.
 * useEffect 내에서 사용해야 합니다.
 */
export function useEvaluationUpdates(callback: (data: any) => void) {
  if (typeof window === 'undefined') return undefined;

  // CustomEvent 리스너
  const handleCustomEvent = (event: any) => {
    callback(event.detail);
  };

  // localStorage 변경 감지 (다른 탭/윈도우에서의 업데이트)
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'evaluationUpdate' && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        callback(data);
      } catch (error) {
        console.error('Error parsing evaluation update data:', error);
      }
    }
  };

  window.addEventListener('evaluationUpdate', handleCustomEvent);
  window.addEventListener('storage', handleStorageChange);

  // Cleanup function
  return () => {
    window.removeEventListener('evaluationUpdate', handleCustomEvent);
    window.removeEventListener('storage', handleStorageChange);
  };
}

/**
 * 평가 상태 정보 계산
 */
export function calculateEvaluationStatus(modelsData: ModelEvaluationData[]) {
  const deepEvalCriteria = [
    '환각 방지', '독성 방지', '편향 방지', '충실성', '답변 관련성', 
    '문맥 정확성', '일관성', 'PII 유출 방지'
  ];

  const deepTeamCriteria = [
    '프롬프트 주입 방지', '탈옥 방지', '역할 혼동 방지', '사회공학 방지'
  ];

  const psychologyCriteria = [
    '논리적 사고력 평가', '창의적 문제해결력', '언어 이해능력', 
    '학습 적응력', '정보 처리 속도', '인지 유연성'
  ];

  const educationalQualityCriteria = [
    '교육과정 적합성', '발달단계 적절성', '학습 효과성', '안전성 검증'
  ];

  const deepEval = deepEvalCriteria.map(criterion => {
    const completed = modelsData.filter(model => 
      model.evaluations.deepEvalScore && model.evaluations.deepEvalScore > 0
    ).length;
    return { 
      name: criterion, 
      completed, 
      total: modelsData.length, 
      percentage: modelsData.length > 0 ? Math.round((completed / modelsData.length) * 100) : 0 
    };
  });

  const deepTeam = deepTeamCriteria.map(criterion => {
    const completed = modelsData.filter(model => 
      model.evaluations.deepTeamScore && model.evaluations.deepTeamScore > 0
    ).length;
    return { 
      name: criterion, 
      completed, 
      total: modelsData.length, 
      percentage: modelsData.length > 0 ? Math.round((completed / modelsData.length) * 100) : 0 
    };
  });

  const psychology = psychologyCriteria.map(criterion => {
    const completed = modelsData.filter(model => 
      model.evaluations.psychologyScore && model.evaluations.psychologyScore > 0
    ).length;
    return { 
      name: criterion, 
      completed, 
      total: modelsData.length, 
      percentage: modelsData.length > 0 ? Math.round((completed / modelsData.length) * 100) : 0 
    };
  });

  const educationalQuality = educationalQualityCriteria.map(criterion => {
    const completed = modelsData.filter(model => 
      model.evaluations.educationalQualityScore && model.evaluations.educationalQualityScore > 0
    ).length;
    return { 
      name: criterion, 
      completed, 
      total: modelsData.length, 
      percentage: modelsData.length > 0 ? Math.round((completed / modelsData.length) * 100) : 0 
    };
  });

  return {
    deepEval,
    deepTeam,
    psychology,
    educationalQuality
  };
}

/**
 * 대시보드 메트릭 계산
 */
export function calculateDashboardMetrics(modelsData: ModelEvaluationData[]) {
  const completedModels = modelsData.filter(model => 
    (model.evaluations.deepEvalScore && model.evaluations.deepEvalScore > 0) ||
    (model.evaluations.deepTeamScore && model.evaluations.deepTeamScore > 0) ||
    (model.evaluations.psychologyScore && model.evaluations.psychologyScore > 0) ||
    (model.evaluations.educationalQualityScore && model.evaluations.educationalQualityScore > 0) ||
    (model.evaluations.externalScore && model.evaluations.externalScore > 0)
  ).length;

  const avgDeepEvalScore = modelsData.reduce((sum, model) => 
    sum + (model.evaluations.deepEvalScore || 0), 0) / modelsData.length || 0;
    
  const avgDeepTeamScore = modelsData.reduce((sum, model) => 
    sum + (model.evaluations.deepTeamScore || 0), 0) / modelsData.length || 0;
    
  const avgPsychologyScore = modelsData.reduce((sum, model) => 
    sum + (model.evaluations.psychologyScore || 0), 0) / modelsData.length || 0;
    
  const avgEducationalQualityScore = modelsData.reduce((sum, model) => 
    sum + (model.evaluations.educationalQualityScore || 0), 0) / modelsData.length || 0;

  const evaluationStatus = calculateEvaluationStatus(modelsData);
  
  const totalCompletionPercentage = Math.round(
    (evaluationStatus.deepEval.reduce((sum, s) => sum + s.percentage, 0) / (evaluationStatus.deepEval.length * 100) +
     evaluationStatus.deepTeam.reduce((sum, s) => sum + s.percentage, 0) / (evaluationStatus.deepTeam.length * 100) +
     evaluationStatus.psychology.reduce((sum, s) => sum + s.percentage, 0) / (evaluationStatus.psychology.length * 100) +
     evaluationStatus.educationalQuality.reduce((sum, s) => sum + s.percentage, 0) / (evaluationStatus.educationalQuality.length * 100)) * 25
  );

  return {
    completedModels,
    totalModels: modelsData.length,
    avgDeepEvalScore: Math.round(avgDeepEvalScore),
    avgDeepTeamScore: Math.round(avgDeepTeamScore),
    avgPsychologyScore: Math.round(avgPsychologyScore),
    avgEducationalQualityScore: Math.round(avgEducationalQualityScore),
    totalCompletionPercentage,
    evaluationStatus
  };
}
