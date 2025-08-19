'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon, PlayIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { broadcastEvaluationUpdate } from '@/lib/evaluation-sync';

interface MetricResult {
  metric: string;
  score: number;
  threshold: number;
  passed: boolean;
  details: {
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
  };
  timestamp: string;
}

interface ModelResult {
  model: string;
  status: 'running' | 'completed' | 'error';
  metrics: Record<string, MetricResult>;
}

interface EvaluationJob {
  id: string;
  status: 'running' | 'completed' | 'error';
  category: string;
  categoryName: string;
  metrics: string[];
  models: string[];
  startTime: string;
  endTime?: string;
  progress: number;
  results: Record<string, ModelResult>;
  summary?: {
    modelScores: Record<string, number>;
    overallScore: number;
    recommendation: 'excellent' | 'good' | 'needs_improvement';
  };
  error?: string;
}

const ETHICS_CATEGORIES: Record<string, string> = {
  'accountability': '책임성',
  'data-privacy': '데이터 프라이버시',
  'fairness': '공정성',
  'inclusion': '포용성',
  'transparency': '투명성',
  'harm-prevention': '위해 방지',
  'safety': '안전성',
  'maintenance': '유지보수성',
  'risk-management': '위험 관리',
  'stability': '안정성'
};

const METRIC_NAMES: Record<string, string> = {
  'bias': '편향성 방지',
  'toxicity': '독성 방지',
  'hallucination': '환각 방지',
  'professionalism': '전문성',
  'clarity': '명확성',
  'coherence': '일관성',
  'pii': 'PII 보호',
  'security_overall': '전체 보안성',
  'jailbreaking': '탈옥 저항성',
  'prompt_injection': '프롬프트 주입 방지',
  'role_confusion': '역할 혼동 방지',
  'social_engineering': '사회공학 방지',
  'responsibility_evasion': '책임 회피 방지'
};

const MODEL_CONFIGS: Record<string, { name: string }> = {
  'claude': { name: 'Claude 3 Opus' },
  'gemini': { name: 'Gemini 2.0 Flash' },
  'gpt': { name: 'GPT-4 Turbo' }
};

// 모델 키를 실제 모델 ID로 변환하는 함수
const getActualModelId = async (modelKey: string): Promise<string> => {
  try {
    const response = await fetch('/api/models');
    if (response.ok) {
      const models = await response.json();
      
      // 모델 키와 이름을 매핑
      const keyToNameMap: Record<string, string> = {
        'claude': 'Claude-3-Opus',
        'gemini': 'Gemini-2.0-Flash',
        'gpt': 'GPT-4-Turbo'
      };
      
      const targetName = keyToNameMap[modelKey];
      if (targetName) {
        const foundModel = models.find((model: any) => 
          model.name === targetName || 
          model.name.toLowerCase().includes(modelKey.toLowerCase())
        );
        
        if (foundModel) {
          console.log(`✅ 모델 키 ${modelKey} -> ID ${foundModel.id} (${foundModel.name})`);
          return foundModel.id;
        }
      }
    }
  } catch (error) {
    console.error('모델 ID 변환 실패:', error);
  }
  
  console.warn(`⚠️ 모델 키 ${modelKey}에 대한 ID를 찾지 못했습니다.`);
  return modelKey; // fallback
};

export default function DeepMetricsEvaluation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  
  const [focusCategory, setFocusCategory] = useState<string | null>(null);
  const [evaluationType, setEvaluationType] = useState<'quality' | 'security'>('quality');
  const [activeFramework, setActiveFramework] = useState<'deepeval' | 'deepteam'>('deepeval');
  const [evaluationJob, setEvaluationJob] = useState<EvaluationJob | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(['claude', 'gemini', 'gpt']);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [evaluationLogs, setEvaluationLogs] = useState<string[]>([]);
  const [previousResults, setPreviousResults] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [categoryProgress, setCategoryProgress] = useState<Record<string, boolean>>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const focus = searchParams.get('focus');
    const type = searchParams.get('type') as 'quality' | 'security';
    console.log('🔧 URL 파라미터 처리:', { focus, type, url: window.location.href });
    
    if (focus && ETHICS_CATEGORIES[focus]) {
      console.log(`📋 카테고리 설정: ${focus}`);
      setFocusCategory(focus);
    }
    if (type && ['quality', 'security'].includes(type)) {
      console.log(`⚙️ 평가 타입 설정: ${type}`);
      setEvaluationType(type);
    }
  }, [searchParams]);

  // focusCategory와 evaluationType이 설정된 후에 데이터 로드
  useEffect(() => {
    if (focusCategory) {
      console.log(`🔍 ${focusCategory} 카테고리 설정됨, 데이터 로드 시작`);
      
      // 이전 평가 결과 로드
      loadPreviousResults();
      
      // 진행 중인 평가 복원
      restoreOngoingEvaluation();
    }
    
    // 카테고리별 진행 상태는 항상 로드
    loadCategoryProgress();
  }, [focusCategory, evaluationType]);

  // 페이지 가시성 변경 시 상태 확인
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && focusCategory) {
        // 탭이 다시 활성화되면 상태 확인
        console.log('🔄 탭 활성화됨, 상태 확인 중...');
        restoreOngoingEvaluation();
        loadPreviousResults();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [focusCategory, evaluationType]);

  // 진행 중인 평가 복원 (새로고침 대응)
  const restoreOngoingEvaluation = async () => {
    if (!focusCategory) return;
    
    try {
      // 로컬 저장소에서 평가 상태 확인
      const savedState = localStorage.getItem('deepMetricsEvaluation');
      let localEvaluationState = null;
      
      if (savedState) {
        try {
          localEvaluationState = JSON.parse(savedState);
          // 1시간 이상 된 상태는 무효화
          if (Date.now() - localEvaluationState.timestamp > 3600000) {
            localStorage.removeItem('deepMetricsEvaluation');
            localEvaluationState = null;
          }
        } catch (e) {
          localStorage.removeItem('deepMetricsEvaluation');
        }
      }
      
      // 현재 진행 중인 평가 작업 확인
      const response = await fetch('/api/evaluation/deep-metrics');
      const result = await response.json();
      
      if (result.success && result.data?.evaluations) {
        // 현재 카테고리와 타입에 맞는 진행 중인 평가 찾기
        const ongoingEval = result.data.evaluations.find((evaluation: any) => 
          evaluation.ethicsCategory === focusCategory && 
          evaluation.evaluationType === evaluationType &&
          (evaluation.status === 'running' || evaluation.status === 'pending')
        );
        
        if (ongoingEval || (localEvaluationState && localEvaluationState.isEvaluating)) {
          if (ongoingEval) {
            console.log('🔄 서버에서 진행 중인 평가 복원:', ongoingEval.id);
            setEvaluationJob(ongoingEval);
            setIsEvaluating(true);
            setEvaluationLogs([`🔄 평가 복원됨: ${ongoingEval.framework || evaluationType} 평가 진행 중...`]);
            
            // 폴링 재시작
            pollEvaluationStatus(ongoingEval.id);
          } else if (localEvaluationState) {
            console.log('🔄 로컬 상태에서 평가 중임을 감지, 서버 상태 확인 중...');
            setIsEvaluating(true);
            setEvaluationLogs([`🔄 평가 상태 확인 중...`]);
            
            // 로컬에 평가 중 상태가 있지만 서버에 없다면 5초 후 다시 확인
            setTimeout(() => restoreOngoingEvaluation(), 5000);
          }
        }
      } else if (localEvaluationState && localEvaluationState.isEvaluating) {
        // 서버 응답 실패 시 로컬 상태 기반으로 복원 시도
        console.log('🔄 서버 응답 실패, 로컬 상태 기반 복원 시도');
        setIsEvaluating(true);
        setEvaluationLogs([`🔄 연결 문제로 인한 상태 복원 중...`]);
        setTimeout(() => restoreOngoingEvaluation(), 5000);
      }
    } catch (error) {
      console.warn('진행 중인 평가 복원 실패:', error);
    }
  };

  const loadPreviousResults = async () => {
    if (!focusCategory) return;
    
    console.log('🔍 이전 평가 결과 로딩 시작...', focusCategory, evaluationType);
    setIsLoadingHistory(true);
    
    try {
      // 항상 최신 데이터를 가져오기 위해 캐시 방지
      const apiUrl = `/api/evaluation/deep-metrics/history?category=${focusCategory}&type=${evaluationType}&limit=10`;
      console.log(`🌐 API 호출: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      console.log(`📡 API 응답 상태: ${response.status}`);
      const result = await response.json();
      console.log(`📊 API 응답 원본:`, result);
      
      if (result.success) {
        // 결과 데이터 확인
        console.log('📊 API 응답 상세:', {
          success: result.success,
          dataLength: result.data?.length || 0,
          data: result.data,
          focusCategory,
          evaluationType
        });
        
        // API가 빈 결과를 반환하면 전체 결과에서 필터링 시도
        if (!result.data || result.data.length === 0) {
          console.log('🔄 API 결과가 비어있음, 전체 결과에서 필터링 시도...');
          try {
            const allResultsResponse = await fetch('/api/evaluation/deep-metrics/history', {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            });
            
            if (allResultsResponse.ok) {
              const allResults = await allResultsResponse.json();
              console.log(`📋 전체 결과에서 필터링: ${allResults.data?.length || 0}개 중에서 검색`);
              
              if (allResults.success && allResults.data) {
                const filteredResults = allResults.data.filter((item: any) => {
                  const categoryMatch = item.category === focusCategory || item.ethicsCategory === focusCategory;
                  const typeMatch = item.evaluationType === evaluationType;
                  return categoryMatch && typeMatch;
                });
                
                console.log(`🎯 필터링 결과: ${filteredResults.length}개 발견`);
                if (filteredResults.length > 0) {
                  result.data = filteredResults.slice(0, 10); // 최대 10개로 제한
                  console.log('✅ 클라이언트 측 필터링으로 결과 발견');
                }
              }
            }
          } catch (filterError) {
            console.error('클라이언트 측 필터링 실패:', filterError);
          }
        }
        
        setPreviousResults(result.data || []);
        
        // 가장 최신 결과가 있으면 자동으로 표시
        if (result.data && result.data.length > 0) {
          const latestResult = result.data[0];
          console.log('🎯 최신 결과 상세 정보:', {
            evaluation_id: latestResult.id || latestResult.evaluation_id,
            status: latestResult.status,
            results: latestResult.results,
            model_results: latestResult.model_results,
            hasResults: !!latestResult.results,
            hasModelResults: !!latestResult.model_results,
            resultsKeys: latestResult.results ? Object.keys(latestResult.results) : [],
            modelResultsKeys: latestResult.model_results ? Object.keys(latestResult.model_results) : []
          });
          
          // results 또는 model_results 둘 다 확인
          const modelResults = latestResult.results || latestResult.model_results;
          
          if (modelResults && Object.keys(modelResults).length > 0) {
            // 첫 번째 모델의 메트릭 가져오기
            const firstModelKey = Object.keys(modelResults)[0];
            const firstModelResult = modelResults[firstModelKey];
            
            const job: EvaluationJob = {
              id: latestResult.id || latestResult.evaluation_id,
              status: 'completed',
              category: focusCategory,
              categoryName: ETHICS_CATEGORIES[focusCategory],
              metrics: firstModelResult?.metrics ? Object.keys(firstModelResult.metrics) : (latestResult.metrics || []),
              models: Object.keys(modelResults),
              startTime: latestResult.startTime || latestResult.start_time || latestResult.created_at,
              endTime: latestResult.endTime || latestResult.end_time,
              progress: 100,
              results: modelResults,
              summary: latestResult.summary
            };
            
            console.log('🔧 생성된 Job 객체:', job);
            setEvaluationJob(job);
            console.log('✅ 최신 평가 결과 자동 표시 완료 - evaluationJob 상태 업데이트됨');
            
            // 로드된 결과도 다른 페이지에 브로드캐스트
            (async () => {
              try {
                for (const [modelKey, modelResult] of Object.entries(modelResults)) {
                  if ((modelResult as any).status === 'completed' && latestResult.summary?.modelScores?.[modelKey] !== undefined) {
                    // 모델 키를 실제 모델 ID로 변환
                    const actualModelId = await getActualModelId(modelKey);
                    
                    const broadcastData = {
                      score: latestResult.summary.modelScores[modelKey],
                      category: focusCategory,
                      framework: latestResult.framework || 'DeepEval'
                    };
                    
                    console.log('📡 기존 결과 브로드캐스트:', { 
                      modelKey, 
                      actualModelId, 
                      data: broadcastData 
                    });
                    const broadcastType = latestResult.framework === 'DeepTeam' ? 'deep-team' : 'deep-eval';
                    broadcastEvaluationUpdate(actualModelId, broadcastType, broadcastData);
                  }
                }
              } catch (broadcastError) {
                console.error('기존 결과 브로드캐스트 오류:', broadcastError);
              }
            })();
          } else {
            console.log('⚠️ results 또는 model_results가 없거나 비어있음:', {
              results: latestResult.results,
              model_results: latestResult.model_results
            });
          }
        } else {
          console.log('ℹ️ 이 카테고리에 이전 평가 결과가 없습니다.');
          setEvaluationJob(null); // 결과가 없으면 명시적으로 null 설정
        }
        
        // 카테고리별 진행 상태도 업데이트
        loadCategoryProgress();
      } else {
        console.log('❌ 평가 결과 로드 실패:', result.error);
        setPreviousResults([]);
      }
    } catch (error) {
      console.error('이전 평가 결과 로딩 실패:', error);
      setPreviousResults([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 카테고리별 진행 상태 로드
  const loadCategoryProgress = async () => {
    try {
      console.log('📊 전체 카테고리 진행 상태 확인 중...', { evaluationType });
      
      const progressData: Record<string, boolean> = {};
      
      // 각 카테고리별로 최근 평가 결과가 있는지 병렬로 확인
      const progressPromises = Object.entries(ETHICS_CATEGORIES).map(async ([categoryKey, categoryName]) => {
        try {
          const url = `/api/evaluation/deep-metrics/history?category=${categoryKey}&type=${evaluationType}&limit=1`;
          console.log(`🔍 ${categoryName} 확인 중:`, url);
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const hasData = data.success && data.data && data.data.length > 0;
            progressData[categoryKey] = hasData;
            
            console.log(`${categoryName} 결과:`, {
              success: data.success,
              hasData,
              dataLength: data.data?.length || 0
            });
          } else {
            console.warn(`${categoryName} API 호출 실패:`, response.status);
            progressData[categoryKey] = false;
          }
        } catch (error) {
          console.warn(`${categoryName} 진행 상태 확인 실패:`, error);
          progressData[categoryKey] = false;
        }
      });
      
      await Promise.all(progressPromises);
      
      console.log('📋 최종 진행 상태 데이터:', progressData);
      setCategoryProgress(progressData);
      
      const completedCount = Object.values(progressData).filter(Boolean).length;
      console.log(`✅ 카테고리 진행 상태 로드 완료: ${completedCount}/${Object.keys(ETHICS_CATEGORIES).length} 완료`);
      
    } catch (error) {
      console.error('카테고리 진행 상태 로드 중 오류:', error);
    }
  };

  const startEvaluation = async () => {
    if (!focusCategory) return;

    setIsEvaluating(true);
    setEvaluationJob(null); // 이전 결과 초기화
    setEvaluationLogs([]); // 로그 초기화
    
    // 평가 시작 상태를 로컬 저장소에 저장
    const evaluationState = {
      isEvaluating: true,
      focusCategory,
      evaluationType,
      selectedModels,
      timestamp: Date.now()
    };
    localStorage.setItem('deepMetricsEvaluation', JSON.stringify(evaluationState));
    try {
      const response = await fetch('/api/evaluation/deep-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ethicsCategory: focusCategory,
          models: selectedModels,
          evaluationType: evaluationType
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // 평가 상태 폴링 시작
        pollEvaluationStatus(result.evaluationId);
      } else {
        console.error('평가 시작 실패:', result.error);
        setIsEvaluating(false);
      }
    } catch (error) {
      console.error('평가 요청 실패:', error);
      setIsEvaluating(false);
    }
  };

  const pollEvaluationStatus = async (evaluationId: string) => {
    let pollCount = 0;
    const maxPolls = 600; // 20분 최대 대기 (2초 * 600 = 1200초)
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/evaluation/deep-metrics?evaluationId=${evaluationId}`);
        const result = await response.json();
        
        if (result.success) {
          const prevJob = evaluationJob;
          setEvaluationJob(result.data);
          
          // 진행률 변화 로그 추가
          if (prevJob && prevJob.progress !== result.data.progress) {
            const logMessage = `📊 진행률: ${result.data.progress}% (${result.data.framework} 평가)`;
            setEvaluationLogs(prev => [...prev.slice(-10), logMessage]); // 최근 10개만 유지
          }
          
          // 모델별 상태 변화 로그
          if (result.data.results) {
            Object.entries(result.data.results).forEach(([modelKey, modelResult]: [string, any]) => {
              if (modelResult.status === 'completed' && (!prevJob?.results[modelKey] || prevJob.results[modelKey].status !== 'completed')) {
                const logMessage = `✅ ${modelResult.model} 평가 완료`;
                setEvaluationLogs(prev => [...prev.slice(-10), logMessage]);
              }
            });
          }
          
          if (result.data.status === 'completed' || result.data.status === 'error') {
            setIsEvaluating(false);
            const finalMessage = result.data.status === 'completed' 
              ? `🎉 모든 평가 완료! (${result.data.framework})`
              : `❌ 평가 실패: ${result.data.error}`;
            setEvaluationLogs(prev => [...prev.slice(-10), finalMessage]);
            
            // 평가 완료 브로드캐스트
            if (result.data.status === 'completed') {
              try {
                // 각 모델별로 브로드캐스트
                console.log('🔍 브로드캐스트 준비:', {
                  hasResults: !!result.data.results,
                  resultKeys: result.data.results ? Object.keys(result.data.results) : [],
                  category: result.data.category,
                  framework: result.data.framework
                });
                
                if (result.data.results) {
                  // 비동기 처리를 위해 Promise.all 사용
                  const broadcastPromises = Object.entries(result.data.results).map(async ([modelKey, modelResult]: [string, any]) => {
                    console.log(`🔍 모델 ${modelKey} 처리 중:`, {
                      status: modelResult.status,
                      hasJobSummary: !!result.data.summary,
                      modelScore: result.data.summary?.modelScores?.[modelKey]
                    });
                    
                    if (modelResult.status === 'completed' && result.data.summary?.modelScores?.[modelKey] !== undefined) {
                      // 모델 키를 실제 모델 ID로 변환
                      const actualModelId = await getActualModelId(modelKey);
                      
                      const broadcastData = {
                        score: result.data.summary.modelScores[modelKey],
                        category: result.data.category,
                        framework: result.data.framework
                      };
                      
                      console.log('📡 브로드캐스트 데이터:', { 
                        modelKey, 
                        actualModelId, 
                        data: broadcastData 
                      });
                      
                      const broadcastType = evaluation.framework === 'DeepTeam' ? 'deep-team' : 'deep-eval';
                      broadcastEvaluationUpdate(actualModelId, broadcastType, broadcastData);
                      console.log('✅ Deep 메트릭 평가 완료 브로드캐스트 전송 완료:', actualModelId);
                    } else {
                      console.log(`⚠️ 모델 ${modelKey} 브로드캐스트 조건 미충족:`, {
                        status: modelResult.status,
                        hasJobSummary: !!result.data.summary,
                        modelScore: result.data.summary?.modelScores?.[modelKey]
                      });
                    }
                  });
                  
                  // 모든 브로드캐스트 완료 대기
                  Promise.all(broadcastPromises).catch(error => {
                    console.error('브로드캐스트 처리 중 오류:', error);
                  });
                } else {
                  console.log('❌ results 필드가 없어서 브로드캐스트 불가');
                }
                
                // 평가 완료 시 해당 카테고리 진행 상태 업데이트
                if (focusCategory) {
                  setCategoryProgress(prev => ({
                    ...prev,
                    [focusCategory]: true
                  }));
                  console.log(`✅ ${ETHICS_CATEGORIES[focusCategory]} 카테고리 완료 표시 업데이트`);
                }
              } catch (broadcastError) {
                console.error('브로드캐스트 오류:', broadcastError);
              }
            }
            
            // 로컬 저장소 정리
            localStorage.removeItem('deepMetricsEvaluation');
            
            // 평가 완료 후 이전 결과 다시 로드
            if (result.data.status === 'completed') {
              // 완료된 결과를 즉시 표시
              setEvaluationJob(result.data);
              setTimeout(() => loadPreviousResults(), 1000);
            }
            return;
          }
          
          pollCount++;
          if (pollCount >= maxPolls) {
            // 타임아웃 발생해도 isEvaluating은 true로 유지하여 사용자가 평가 진행 중임을 알 수 있게 함
            // setIsEvaluating(false);
            setEvaluationLogs(prev => [...prev.slice(-10), '⏰ 평가가 오래 걸리고 있습니다. 서버에서 계속 처리 중이니 기다려주세요...']);
            // 평가 자체는 계속 진행되도록 유지 (타임아웃으로 중단하지 않음)
            setTimeout(poll, 10000); // 10초마다 계속 폴링
            return;
          }
          
          // 계속 폴링 (더 짧은 간격으로)
          setTimeout(poll, 500); // 0.5초마다 폴링 (더 빠른 동기화)
        }
      } catch (error) {
        console.error('평가 상태 조회 실패:', error);
        setEvaluationLogs(prev => [...prev.slice(-10), `⚠️ 연결 문제 발생, 재시도 중...`]);
        
        // 연결 문제일 수 있으므로 몇 번 재시도
        pollCount++;
        if (pollCount < maxPolls) {
          setTimeout(poll, 5000); // 5초 후 재시도
        } else {
          // 연결 실패 시에도 계속 시도
          // setIsEvaluating(false);
          setEvaluationLogs(prev => [...prev.slice(-10), `⚠️ 연결 상태가 좋지 않습니다. 계속 재시도 중...`]);
          setTimeout(poll, 15000); // 15초마다 계속 시도
        }
      }
    };
    
    // 초기 로그
    setEvaluationLogs([`🚀 ${evaluationType === 'quality' ? 'DeepEval 품질/윤리' : 'DeepTeam 보안'} 평가 시작...`]);
    poll();
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-500/20 border-green-500';
    if (score >= 70) return 'bg-yellow-500/20 border-yellow-500';
    return 'bg-red-500/20 border-red-500';
  };

  const renderEvaluationResults = () => {
    if (!evaluationJob) return null;

    return (
      <div className="mt-8">
        <div className="bg-transparent border border-lime rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {evaluationJob.categoryName} Deep 메트릭 평가 결과
            </h3>
            <div className="flex items-center space-x-4">
              {evaluationJob.status === 'running' && (
                <div className="flex items-center text-yellow-400">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  <span>진행 중... {evaluationJob.progress}%</span>
                </div>
              )}
              {evaluationJob.status === 'completed' && (
                <div className="flex items-center text-green-400">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  <span>완료</span>
                </div>
              )}
              {evaluationJob.status === 'error' && (
                <div className="flex items-center text-red-400">
                  <XCircleIcon className="w-5 h-5 mr-2" />
                  <span>오류</span>
                </div>
              )}
            </div>
          </div>

          {evaluationJob.status === 'running' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm">진행률</span>
                <span className="text-lime text-sm font-medium">{evaluationJob.progress}%</span>
              </div>
              <div className="bg-grey rounded-full h-3 mb-4">
                <div 
                  className="bg-lime h-3 rounded-full transition-all duration-500"
                  style={{ width: `${evaluationJob.progress}%` }}
                />
              </div>
              
              {/* 실시간 로그 */}
              {evaluationLogs.length > 0 && (
                <div className="bg-black/30 border border-grey rounded-lg p-4">
                  <h4 className="text-white text-sm font-medium mb-2">실시간 진행 상황</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {evaluationLogs.map((log, index) => (
                      <div key={index} className="text-xs text-white/80 font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {evaluationJob.summary && (
            <div className="mb-6 p-4 bg-grey/30 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-3">종합 평가 요약</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(evaluationJob.summary.overallScore)}`}>
                    {evaluationJob.summary.overallScore}점
                  </div>
                  <div className="text-white text-sm">전체 평균</div>
                </div>
                <div className="col-span-2">
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(evaluationJob.summary.modelScores).map(([model, score]) => (
                      <div key={model} className="text-center p-2 bg-grey/50 rounded">
                        <div className={`text-xl font-bold ${getScoreColor(score)}`}>
                          {score}점
                        </div>
                        <div className="text-white text-xs">{model}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {Object.entries(evaluationJob.results).map(([modelKey, modelResult]) => (
              <div key={modelKey} className="border border-grey rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">{modelResult.model}</h4>
                  <div className="flex items-center">
                    {modelResult.status === 'running' && (
                      <ClockIcon className="w-5 h-5 text-yellow-400" />
                    )}
                    {modelResult.status === 'completed' && (
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    )}
                    {modelResult.status === 'error' && (
                      <XCircleIcon className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(modelResult.metrics).map(([metricKey, metricResult]) => (
                    <div 
                      key={metricKey} 
                      className={`p-3 rounded-lg border ${getScoreBgColor(metricResult.score)} cursor-pointer hover:bg-white/5 transition-colors`}
                      onClick={() => setSelectedResponse({ modelKey, metricKey, metricResult })}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">
                          {METRIC_NAMES[metricKey] || metricKey}
                        </span>
                        {metricResult.passed ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(metricResult.score)}`}>
                        {evaluationType === 'security' && metricKey === 'security_overall' 
                          ? `${metricResult.score}% 저항률`
                          : `${metricResult.score}점`
                        }
                      </div>
                      <div className="text-white text-xs mt-1">
                        {evaluationType === 'security' && metricKey === 'security_overall'
                          ? `${metricResult.details.passed_tests}/${metricResult.details.total_tests} 저항`
                          : `${metricResult.details.passed_tests}/${metricResult.details.total_tests} 통과`
                        }
                      </div>
                      <div className="text-white text-xs mt-1 opacity-70">
                        클릭하여 상세 보기
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-grey min-h-screen">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.push('/governance-framework/evaluations/ai-ethics')}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-grey border border-tan/50 rounded-lg hover:bg-tan"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            AI 윤리 평가로 돌아가기
          </button>
          <h1 className="text-[20pt] font-bold text-green ml-4">Deep 메트릭 평가 (통합)</h1>
        </div>
      </div>

      <main className="py-4 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {focusCategory ? (
          <div>
            <div className="bg-transparent shadow rounded-lg border border-lime p-6 mb-6">
              {/* 프레임워크 선택 탭 */}
              <div className="mb-6">
                <div className="flex justify-center">
                  <div className="flex space-x-1 bg-white/10 rounded-xl p-1">
                    <button
                      onClick={() => {
                        setActiveFramework('deepeval');
                        setEvaluationType('quality');
                      }}
                      className={`px-6 py-3 text-lg font-semibold rounded-lg transition-all ${
                        activeFramework === 'deepeval' 
                          ? 'bg-lime text-grey shadow-lg' 
                          : 'text-white hover:bg-white/10 hover:text-lime'
                      }`}
                    >
                      Deep Eval (품질/윤리)
                    </button>
                    <button
                      onClick={() => {
                        setActiveFramework('deepteam');
                        setEvaluationType('security');
                      }}
                      className={`px-6 py-3 text-lg font-semibold rounded-lg transition-all ${
                        activeFramework === 'deepteam' 
                          ? 'bg-red-400 text-grey shadow-lg' 
                          : 'text-white hover:bg-white/10 hover:text-red-400'
                      }`}
                    >
                      Deep Team (보안)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-[20pt] font-semibold text-white">
                    {ETHICS_CATEGORIES[focusCategory]} 평가
                  </h2>
                  {categoryProgress[focusCategory] && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500 rounded-full">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      <span className="text-green-500 text-sm font-medium">평가 완료</span>
                    </div>
                  )}
                  {isLoadingHistory && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 border border-blue-500 rounded-full">
                      <ClockIcon className="w-4 h-4 text-blue-500 animate-spin" />
                      <span className="text-blue-500 text-sm font-medium">로딩 중</span>
                    </div>
                  )}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-white/50">
                      [DEBUG] 현재 상태: {evaluationJob ? '결과 있음' : '결과 없음'} | 히스토리: {previousResults.length}개
                    </div>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  activeFramework === 'deepeval' 
                    ? 'bg-lime/20 text-lime border border-lime' 
                    : 'bg-red-400/20 text-red-400 border border-red-400'
                }`}>
                  {activeFramework === 'deepeval' ? 'DeepEval 프레임워크' : 'DeepTeam 프레임워크'}
                </span>
              </div>
              <p className="text-white mb-6">
                {evaluationType === 'quality' 
                  ? `${ETHICS_CATEGORIES[focusCategory]} 항목에 대한 품질/윤리 메트릭 평가를 수행합니다. 편향성, 독성, 환각, 전문성, 명확성 등 다양한 메트릭을 통해 AI 모델의 윤리적 성능을 종합적으로 분석합니다.`
                  : `${ETHICS_CATEGORIES[focusCategory]} 항목에 대한 보안 취약점 평가를 수행합니다. 탈옥(Jailbreaking), 프롬프트 주입, 역할 혼동, 사회공학 등 다양한 공격 기법에 대한 저항성을 평가합니다.`
                }
              </p>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">평가할 모델 선택</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'claude', name: 'Claude 3 Opus' },
                    { key: 'gemini', name: 'Gemini 2.0 Flash' },
                    { key: 'gpt', name: 'GPT-4 Turbo' }
                  ].map((model) => (
                    <label key={model.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(model.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModels([...selectedModels, model.key]);
                          } else {
                            setSelectedModels(selectedModels.filter(m => m !== model.key));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-white">{model.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={startEvaluation}
                disabled={isEvaluating || selectedModels.length === 0}
                className={`inline-flex items-center px-6 py-3 border-2 text-lg font-medium rounded-md bg-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeFramework === 'deepeval'
                    ? 'border-lime text-lime hover:bg-lime hover:text-grey'
                    : 'border-red-400 text-red-400 hover:bg-red-400 hover:text-grey'
                }`}
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                {isEvaluating 
                  ? '평가 진행 중...' 
                  : activeFramework === 'deepeval' 
                    ? 'Deep Eval 평가 시작' 
                    : 'Deep Team 평가 시작'
                }
              </button>
            </div>

            {renderEvaluationResults()}
            
            {/* 모델 응답 상세 보기 모달 */}
            {selectedResponse && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-grey border border-lime rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-lime">
                    <h3 className="text-[24pt] font-bold text-white">
                      {MODEL_CONFIGS[selectedResponse.modelKey]?.name || selectedResponse.modelKey} - {METRIC_NAMES[selectedResponse.metricKey]}
                    </h3>
                    <button
                      onClick={() => setSelectedResponse(null)}
                      className="text-white hover:text-lime transition-colors"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="p-8 overflow-y-auto max-h-[75vh]">
                    <div className="mb-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`text-[36pt] font-bold ${getScoreColor(selectedResponse.metricResult.score)}`}>
                          {evaluationType === 'security' && selectedResponse.metricKey === 'security_overall' 
                            ? `${selectedResponse.metricResult.score}% 저항률`
                            : `${selectedResponse.metricResult.score}점`
                          }
                        </div>
                        <div className={`px-4 py-2 rounded-full text-[16pt] font-medium ${
                          selectedResponse.metricResult.passed 
                            ? 'bg-green-500/20 text-green-400 border border-green-500'
                            : 'bg-red-500/20 text-red-400 border border-red-500'
                        }`}>
                          {selectedResponse.metricResult.passed ? '통과' : '실패'}
                        </div>
                      </div>
                    </div>

                    {/* 품질 평가 결과 */}
                    {evaluationType === 'quality' && selectedResponse.metricResult.details?.individual_results && (
                      <div className="space-y-6">
                        <h4 className="text-[20pt] font-semibold text-white mb-4">테스트 케이스별 상세 결과</h4>
                        {selectedResponse.metricResult.details.individual_results.map((result: any, index: number) => (
                          <div key={index} className="bg-grey/50 border border-grey rounded-lg p-4">
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[14pt] font-medium text-lime">테스트 케이스 {result.test_case}</span>
                                <span className={`text-[14pt] font-medium ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                                  {result.score?.toFixed(2)}점 ({result.passed ? '통과' : '실패'})
                                </span>
                              </div>
                              <div className="text-white text-[14pt]">
                                <strong>질문:</strong> {result.input}
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <div className="text-white text-sm">
                                <strong>모델 응답:</strong>
                              </div>
                              <div className="bg-black/30 rounded p-3 mt-2 text-white text-sm">
                                {result.actual}
                              </div>
                            </div>
                            
                            {result.reason && (
                              <div className="text-white text-xs opacity-80">
                                <strong>평가 근거:</strong> {result.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 보안 평가 결과 */}
                    {evaluationType === 'security' && selectedResponse.metricResult.details?.attack_types && (
                      <div className="space-y-6">
                        <h4 className="text-[20pt] font-semibold text-white mb-4">공격 유형별 상세 결과</h4>
                        {Object.entries(selectedResponse.metricResult.details.attack_types).map(([attackType, attackData]: [string, any]) => (
                          <div key={attackType} className="bg-grey/50 border border-grey rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-[16pt] font-semibold text-lime">
                                {METRIC_NAMES[attackType] || attackType}
                              </h5>
                              <span className="text-[14pt] text-white">
                                {attackData.summary?.resisted || 0}/{attackData.summary?.total_tests || 0} 저항 
                                ({((attackData.summary?.resisted || 0) / (attackData.summary?.total_tests || 1) * 100).toFixed(1)}%)
                              </span>
                            </div>
                            
                            <div className="space-y-3">
                              {attackData.results?.map((result: any, index: number) => (
                                <div key={index} className="bg-black/30 rounded p-3">
                                  <div className="mb-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[12pt] text-lime">공격 시나리오 {result.test_case}</span>
                                      <span className={`text-[12pt] font-medium ${
                                        result.resisted ? 'text-green-400' : 'text-red-400'
                                      }`}>
                                        {result.security_level} ({result.resisted ? '저항 성공' : '저항 실패'})
                                      </span>
                                    </div>
                                    <div className="text-white text-[12pt] mb-2">
                                      <strong>공격 프롬프트:</strong> {result.attack_prompt}
                                    </div>
                                  </div>
                                  
                                  <div className="text-white text-[12pt]">
                                    <strong>모델 응답:</strong>
                                    <div className="bg-grey/50 rounded p-2 mt-1 text-white text-[11pt]">
                                      {result.response}
                                    </div>
                                  </div>
                                  
                                  {!result.resisted && (
                                    <div className="text-red-400 text-[12pt] mt-2">
                                      ⚠️ 위험도: {result.risk_score}%
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-transparent shadow rounded-lg border border-lime p-6">
            <h2 className="text-[20pt] font-semibold text-white mb-4">평가할 항목을 선택하세요</h2>
            <p className="text-white mb-6">
              AI 윤리 평가 페이지에서 특정 항목을 선택하여 이 페이지에 접근하세요.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(ETHICS_CATEGORIES).map(([key, name]) => {
                const isCompleted = categoryProgress[key];
                return (
                  <button
                    key={key}
                    onClick={() => setFocusCategory(key)}
                    className={`relative p-3 border rounded-lg transition-colors ${
                      isCompleted 
                        ? 'border-green-500 bg-green-500/10 text-white hover:bg-green-500 hover:text-grey' 
                        : 'border-lime text-white hover:bg-lime hover:text-grey'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{name}</span>
                      {isCompleted && (
                        <CheckCircleIcon className="w-5 h-5 text-green-500 ml-2" />
                      )}
                    </div>
                    {isCompleted && (
                      <div className="text-xs text-green-400 mt-1">
                        평가 완료
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* 전체 진행률 표시 */}
            <div className="mt-6 p-4 bg-grey/50 rounded-lg border border-lime/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">전체 진행률</span>
                <span className="text-lime font-bold">
                  {Object.values(categoryProgress).filter(Boolean).length} / {Object.keys(ETHICS_CATEGORIES).length}
                </span>
              </div>
              <div className="w-full bg-grey rounded-full h-2">
                <div 
                  className="bg-lime h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${(Object.values(categoryProgress).filter(Boolean).length / Object.keys(ETHICS_CATEGORIES).length) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-white/70 mt-2">
                완료된 항목은 ✅ 표시됩니다. 각 항목을 클릭하여 이전 결과를 확인하거나 새로운 평가를 시작하세요.
              </div>
              
              {/* 디버깅: 진행 상태 확인 */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-3">
                  <summary className="text-xs text-white/50 cursor-pointer">진행 상태 디버그 정보</summary>
                  <pre className="text-xs text-white/50 mt-2 overflow-auto">
                    {JSON.stringify(categoryProgress, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

                  {/* 이전 평가 결과 섹션 - 개선된 UI */}
          {focusCategory && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="mr-2 text-2xl">🕒</span>
                  이전 평가 결과
                  {previousResults.length > 0 && (
                    <span className="ml-2 text-sm text-white/70">
                      ({previousResults.length}개)
                    </span>
                  )}
                </h3>
                {previousResults.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center space-x-2 px-4 py-1.5 rounded-md border border-lime text-lime hover:bg-lime/10 transition-colors"
                  >
                    <span>{showHistory ? '내역 숨기기' : '내역 보기'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                )}
              </div>

              {previousResults.length > 0 ? (
                showHistory ? (
                  <div className="space-y-4 bg-black/20 border border-grey rounded-lg p-4">
                    {previousResults.map((result, index) => (
                      <div 
                        key={result.evaluation_id} 
                        className={`bg-grey/30 border rounded-lg p-4 ${
                          evaluationJob?.id === result.id || evaluationJob?.id === result.evaluation_id
                            ? 'border-lime shadow-[0_0_10px_rgba(142,220,157,0.3)]' 
                            : 'border-grey'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              result.evaluation_type === 'quality'
                                ? 'bg-lime/20 text-lime border border-lime'
                                : 'bg-red-400/20 text-red-400 border border-red-400'
                            }`}>
                              {result.evaluation_type === 'quality' ? 'DeepEval' : 'DeepTeam'}
                            </span>
                            <span className="text-white text-sm">
                              {new Date(result.created_at || result.startTime).toLocaleString('ko-KR')}
                            </span>
                          </div>
                          {result.summary?.overallScore !== undefined && (
                            <span className="text-lime text-sm font-medium flex items-center">
                              <span className="mr-1">전체 점수:</span>
                              <span className={`px-2 py-1 rounded ${getScoreBgColor(result.summary.overallScore)}`}>
                                {result.summary.overallScore}점
                              </span>
                            </span>
                          )}
                        </div>

                        {/* 현재 표시 중인 결과와 동일한 평가라면 표시 */}
                        {(evaluationJob?.id === result.id || evaluationJob?.id === result.evaluation_id) && (
                          <div className="mb-3 bg-lime/10 border border-lime rounded px-3 py-2 text-xs text-lime">
                            현재 표시 중인 평가 결과입니다
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(result.results || {}).map(([modelKey, modelResult]: [string, any]) => (
                            <div key={modelKey} className="bg-black/30 rounded p-3">
                              <h4 className="text-white font-medium mb-2 flex justify-between">
                                <span>{MODEL_CONFIGS[modelKey]?.name || modelKey}</span>
                                {modelResult.status === 'completed' ? (
                                  <span className="text-green-400 text-xs">완료됨</span>
                                ) : (
                                  <span className="text-yellow-400 text-xs">진행 중</span>
                                )}
                              </h4>
                              <div className="space-y-2">
                                {Object.entries(modelResult.metrics || {}).map(([metricKey, metricData]: [string, any]) => (
                                  <div key={metricKey} className="flex items-center justify-between">
                                    <span className="text-white/70 text-xs">
                                      {METRIC_NAMES[metricKey] || metricKey}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-xs font-medium ${getScoreColor(metricData.score)}`}>
                                        {metricData.score}점
                                      </span>
                                      <button
                                        onClick={() => setSelectedResponse({
                                          modelKey,
                                          metricKey,
                                          metricResult: metricData
                                        })}
                                        className="text-lime hover:text-lime/80 text-xs hover:underline"
                                      >
                                        상세
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* 즉시 결과 보기 버튼 */}
                              <button
                                onClick={() => setEvaluationJob(result)}
                                className="w-full mt-3 text-xs py-1 px-2 rounded border border-lime text-lime hover:bg-lime/10"
                              >
                                이 결과 보기
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-grey rounded-lg">
                    <p className="text-white/70">
                      {previousResults.length}개의 이전 평가 결과가 있습니다. '내역 보기' 버튼을 클릭하여 확인하세요.
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 border border-grey rounded-lg">
                  <p className="text-white/70">
                    아직 실행된 평가 결과가 없습니다. '평가 시작' 버튼을 클릭하여 새 평가를 시작하세요.
                  </p>
                </div>
              )}
            </div>
          )}
      </main>
    </div>
  );
}
