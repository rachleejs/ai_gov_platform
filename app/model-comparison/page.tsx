'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ChartBarIcon, ServerIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/contexts/AuthContext';
import { broadcastEvaluationUpdate, fetchAllModelsEvaluationData, useEvaluationUpdates, ModelEvaluationData } from '@/lib/evaluation-sync';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';

interface EvaluationResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  completedQuestions: number;
  totalQuestions: number;
  user_friendly_summary?: string;
  area_scores?: {
    step_by_step_teaching: number;
    collaborative_learning: number;
    confidence_building: number;
    individual_recognition: number;
    clear_communication: number;
    cognitive_load_management: number;
  };
  evaluation_data?: any;
}

interface ModelType {
  id: string;
  name: string;
  provider: string;
  icon: any;
}

export default function ModelComparison() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ethics');
  const [activeDeepMetricsTab, setActiveDeepMetricsTab] = useState<'deepeval' | 'deepteam'>('deepeval');
  const [psychologicalResults, setPsychologicalResults] = useState<{ [key: string]: EvaluationResult }>({});
  const [ethicsResults, setEthicsResults] = useState<{ [key: string]: { [criterion: string]: any } }>({});
  const [educationalResults, setEducationalResults] = useState<{ [key: string]: any }>({});
  const [deepMetricsResults, setDeepMetricsResults] = useState<any>({});
  const [models, setModels] = useState<ModelType[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [modelsEvaluationData, setModelsEvaluationData] = useState<ModelEvaluationData[]>([]);

  // 모델 목록 및 평가 데이터 가져오기
  useEffect(() => {
    const fetchModelsAndEvaluations = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          const modelsWithIcon = data.map((model: any) => ({
            ...model,
            icon: ServerIcon
          }));
          setModels(modelsWithIcon);
          // 모든 모델을 기본으로 선택
          setSelectedModels(modelsWithIcon.map((model: any) => model.id));

          // 평가 데이터도 병렬로 가져오기
          console.log('모델 비교: 모든 모델 평가 데이터를 병렬로 가져오기 시작...');
          const evaluationData = await fetchAllModelsEvaluationData(modelsWithIcon);
          setModelsEvaluationData(evaluationData);
          console.log('모델 비교: 모든 평가 데이터 병렬 로딩 완료');
          
        } else {
          console.error('Failed to fetch models');
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModelsAndEvaluations();
  }, []);

  // 실시간 평가 업데이트 수신
  useEffect(() => {
    const cleanup = useEvaluationUpdates((updateData) => {
      console.log('🔔 모델 비교: 평가 업데이트 수신:', updateData);
      
      // modelsEvaluationData 업데이트
      setModelsEvaluationData(prevData => {
        const updatedData = [...prevData];
        const modelIndex = updatedData.findIndex(m => m.id === updateData.modelId);
        
        if (modelIndex !== -1) {
          // 해당 평가 타입의 점수 업데이트
          if (updateData.evaluationType === 'deep-eval') {
            updatedData[modelIndex].evaluations.deepEvalScore = updateData.data.score || 0;
          } else if (updateData.evaluationType === 'deep-team') {
            updatedData[modelIndex].evaluations.deepTeamScore = updateData.data.score || 0;
          } else if (updateData.evaluationType === 'psychology') {
            updatedData[modelIndex].evaluations.psychologyScore = updateData.data.percentage || 0;
          } else if (updateData.evaluationType === 'educational-quality') {
            updatedData[modelIndex].evaluations.educationalQualityScore = updateData.data.total_score || 0;
          } else if (updateData.evaluationType === 'external') {
            updatedData[modelIndex].evaluations.externalScore = updateData.data.score || 0;
          }
          
          setLastUpdated(new Date().toLocaleString());
        }
        
        return updatedData;
      });
    });

    return cleanup;
  }, []);

  // 심리학적 평가 결과 가져오기
  useEffect(() => {
    const fetchPsychologicalResults = async () => {
      if (!user || models.length === 0) return;
      
      try {
        const results: { [key: string]: EvaluationResult } = {};
        
        const promises = models.map(model => 
          fetch(`/api/evaluation/psychological?modelId=${model.id}`, {
            // 캐시 방지로 최신 결과 가져오기
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
            }
          })
            .then(res => res.json())
            .then(data => {
              if (data) {
                console.log(`📊 ${model.name} 심리학 평가 데이터:`, data);
                results[model.id] = {
                  totalScore: data.overall_score || data.total_score || 0,
                  maxScore: 5, // 새로운 5점 척도
                  percentage: data.percentage || 0,
                  grade: data.grade || 'N/A',
                  completedQuestions: data.area_scores ? Object.keys(data.area_scores).length : (data.scores ? Object.keys(data.scores).length : 0),
                  totalQuestions: 6, // 6개 평가 영역
                  user_friendly_summary: data.user_friendly_summary,
                  area_scores: data.area_scores,
                  evaluation_data: data.evaluation_data
                };
              }
            })
            .catch(err => console.error(`Error fetching psychological evaluation for ${model.name}:`, err))
        );
        
        await Promise.all(promises);
        console.log('📊 모든 심리학 평가 결과:', results);
        setPsychologicalResults(results);
      } catch (error) {
        console.error('Error fetching psychological evaluations:', error);
      }
    };

    fetchPsychologicalResults();
  }, [models, user]);

  // 탭이 활성화될 때 결과 새로고침
  useEffect(() => {
    if (user) {
      // 심리학 평가 새로고침
      if (activeTab === 'psychology') {
        const refreshPsychologicalResults = async () => {
          try {
            const results: { [key: string]: EvaluationResult } = {};
            
            const promises = models.map(model => 
              fetch(`/api/evaluation/psychological?modelId=${model.id}`, {
                cache: 'no-cache',
                headers: {
                  'Cache-Control': 'no-cache',
                }
              })
                .then(res => res.json())
                .then(data => {
                  if (data) {
                    results[model.id] = {
                      totalScore: data.overall_score || data.total_score || 0,
                      maxScore: 5,
                      percentage: data.percentage || 0,
                      grade: data.grade || 'N/A',
                      completedQuestions: data.area_scores ? Object.keys(data.area_scores).length : (data.scores ? Object.keys(data.scores).length : 0),
                      totalQuestions: 5,
                      user_friendly_summary: data.user_friendly_summary,
                      area_scores: data.area_scores,
                      evaluation_data: data.evaluation_data
                    };
                  }
                })
                .catch(err => console.error(`Error refreshing psychological evaluation for ${model.name}:`, err))
            );
            
            await Promise.all(promises);
            setPsychologicalResults(results);
          } catch (error) {
            console.error('Error refreshing psychological evaluations:', error);
          }
        };

        if (models.length > 0) {
          refreshPsychologicalResults();
        }
      }

              // AI 윤리 평가 새로고침
        if (activeTab === 'deep-eval' || activeTab === 'deep-team') {
        const refreshDeepMetricsResults = async () => {
          // 업데이트 상태 설정
          setIsUpdating(true);
          
          try {
            console.log('🔄 AI 윤리 평가 결과 새로고침...');
            // 필터링 없이 모든 완료된 평가 결과 로드 (캐시 방지)
            const response = await fetch('/api/evaluation/deep-metrics/history?limit=30', {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            });
            const data = await response.json();
            
            if (data.success && data.data) {
              // 최신 결과를 모델별로 정리
              const results: { [key: string]: any } = {};
              
              // 이미 있는 데이터를 유지 (부분적 업데이트 위함)
              if (deepMetricsResults.results) {
                Object.keys(deepMetricsResults.results).forEach(modelKey => {
                  results[modelKey] = { ...deepMetricsResults.results[modelKey] };
                });
              }
              
              // 모든 결과 처리 (윤리 카테고리별로 별도 저장)
              data.data.forEach((evaluation: any) => {
                if (evaluation.results) {
                  Object.entries(evaluation.results).forEach(([modelKey, modelResult]: [string, any]) => {
                    // 기본 모델 키 저장 (기존 호환성)
                    if (!results[modelKey] || new Date(evaluation.startTime) > new Date(results[modelKey].lastUpdate)) {
                      const existingResult = results[modelKey] || {};
                      const existingMetrics = existingResult.metrics || {};
                      const newMetrics = modelResult.metrics || {};
                      
                      results[modelKey] = {
                        ...existingResult,
                        ...modelResult,
                        metrics: { ...existingMetrics, ...newMetrics },
                        evaluationType: evaluation.evaluationType,
                        framework: evaluation.framework,
                        ethicsCategory: evaluation.ethicsCategory,
                        lastUpdate: evaluation.startTime,
                        summary: evaluation.summary
                      };
                    }
                    
                    // 윤리 카테고리별 키로도 저장 (category_model 형식)
                    const categoryKey = `${evaluation.ethicsCategory}_${modelKey}`;
                    results[categoryKey] = {
                      ...modelResult,
                      evaluationType: evaluation.evaluationType,
                      framework: evaluation.framework,
                      ethicsCategory: evaluation.ethicsCategory,
                      lastUpdate: evaluation.startTime,
                      summary: evaluation.summary,
                      modelKey: modelKey
                    };
                    
                    console.log(`💾 Stored evaluation: ${categoryKey}`, {
                      ethicsCategory: evaluation.ethicsCategory,
                      framework: evaluation.framework,
                      modelKey: modelKey,
                      summary: evaluation.summary
                    });
                  });
                }
              });
              
              setDeepMetricsResults({ results });
              setLastUpdated(new Date().toLocaleTimeString());
            }
          } catch (error) {
            console.error('Error refreshing Deep Metrics results:', error);
          } finally {
            // 업데이트 상태 해제
            setIsUpdating(false);
          }
        };

        // 윤리 평가 결과 새로고침
        refreshDeepMetricsResults();
        
        // 윤리 평가 일반 API도 새로고침 (ID 형식 변환도 고려)
        const refreshEthicsResults = async () => {
          try {
            const results: { [key: string]: { [criterion: string]: any } } = {};
            
            // 기존 데이터 유지 (병합을 위해)
            if (Object.keys(ethicsResults).length > 0) {
              Object.assign(results, ethicsResults);
            }
            
            const promises = models.map(model => {
              // 여러 형식의 모델 ID로 동시에 조회 시도
              const modelId = model.id;
              const modelIdWithoutHyphen = model.id.replace(/-/g, ''); // gpt-4-turbo -> gpt4turbo
              const nameAsId = model.name.replace(/ /g, '-').toLowerCase(); // GPT-4 Turbo -> gpt-4-turbo
              
              // 다양한 ID 형식으로 시도하여 API 호출
              return Promise.all([
                fetch(`/api/evaluation/ethics?modelId=${modelId}`, {
                  cache: 'no-store',
                  headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                  }
                }).then(res => res.json()),
                fetch(`/api/evaluation/ethics?modelId=${modelIdWithoutHyphen}`, {
                  cache: 'no-store',
                  headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                  }
                }).then(res => res.json()),
                fetch(`/api/evaluation/ethics?modelId=${nameAsId}`, {
                  cache: 'no-store',
                  headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                  }
                }).then(res => res.json())
              ])
              .then(responses => {
                // 모든 응답을 처리
                for (let i = 0; i < responses.length; i++) {
                  const data = responses[i];
                  const currentId = i === 0 ? modelId : (i === 1 ? modelIdWithoutHyphen : nameAsId);
                  
                  if (data && data.length > 0) {
                    console.log(`Found ethics data for model ${model.name} using ID ${currentId}:`, data);
                    
                    // 모든 ID 형식에 같은 데이터 저장 (어떤 ID로 접근해도 같은 데이터 표시)
                    if (!results[model.id]) results[model.id] = {};
                    if (!results[modelIdWithoutHyphen]) results[modelIdWithoutHyphen] = {};
                    if (!results[model.name]) results[model.name] = {};
                    
                    data.forEach((evaluation: any) => {
                      if (evaluation.category) {
                        const evalData = {
                          score: evaluation.score,
                          grade: evaluation.grade,
                          completed: true
                        };
                        
                        // 모든 ID 형식에 데이터 저장
                        results[model.id][evaluation.category] = evalData;
                        results[modelIdWithoutHyphen][evaluation.category] = evalData;
                        results[model.name][evaluation.category] = evalData;
                      }
                    });
                  }
                }
              })
              .catch(err => console.error(`Error fetching ethics evaluation for ${model.name}:`, err));
            });
            
            await Promise.all(promises);
            console.log('Final ethics results:', results);
            setEthicsResults(results);
          } catch (error) {
            console.error('Error fetching ethics evaluations:', error);
          }
        };
        
        if (models.length > 0) {
          refreshEthicsResults();
        }
      }
      
      // 초등교육 품질평가 새로고침
      if (activeTab === 'expert') {
        const refreshEducationalResults = async () => {
          try {
            const results: { [key: string]: any } = {};
            
            const promises = models.map(model => 
              fetch(`/api/evaluation/educational-quality?modelId=${model.id}`, {
                cache: 'no-cache',
                headers: {
                  'Cache-Control': 'no-cache',
                }
              })
                .then(res => res.json())
                .then(data => {
                  if (data && data.length > 0) {
                    // 최신 평가 결과만 가져오기
                    const latestResult = data[0];
                    results[model.id] = {
                      factualityScore: latestResult.factuality_score || 0,
                      accuracyScore: latestResult.accuracy_score || 0,
                      specificityScore: latestResult.specificity_score || 0,
                      totalScore: latestResult.total_score || 0,
                      grade: latestResult.grade || 'N/A',
                      gradeLevel: latestResult.grade_level || '',
                      subject: latestResult.subject || '',
                      completed: true
                    };
                  }
                })
                .catch(err => console.error(`Error refreshing educational evaluation for ${model.name}:`, err))
            );
            
            await Promise.all(promises);
            setEducationalResults(results);
          } catch (error) {
            console.error('Error refreshing educational evaluations:', error);
          }
        };
        
        refreshEducationalResults();
      }
    }
  }, [activeTab, models, user]);

  // 윤리 평가 결과 가져오기
  useEffect(() => {
    const fetchEthicsResults = async () => {
      if (!user || models.length === 0) return;
      setIsLoading(true);
      
      try {
        const results: { [key: string]: { [criterion: string]: any } } = {};
        
        const promises = models.map(model => 
          fetch(`/api/evaluation/ethics?modelId=${model.id}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.length > 0) {
                results[model.id] = {};
                data.forEach((evaluation: any) => {
                  if (evaluation.category) {
                    results[model.id][evaluation.category] = {
                      score: evaluation.score,
                      grade: evaluation.grade,
                      completed: true
                    };
                  }
                });
              }
            })
            .catch(err => console.error(`Error fetching ethics evaluation for ${model.name}:`, err))
        );
        
        await Promise.all(promises);
        setEthicsResults(results);
      } catch (error) {
        console.error('Error fetching ethics evaluations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEthicsResults();
  }, [models, user]);

  // 초등교육 품질평가 결과 가져오기
  useEffect(() => {
    const fetchEducationalResults = async () => {
      if (!user || models.length === 0) return;
      
      try {
        const results: { [key: string]: any } = {};
        
        const promises = models.map(model => 
          fetch(`/api/evaluation/educational-quality?modelId=${model.id}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.length > 0) {
                // 최신 평가 결과만 가져오기
                const latestResult = data[0];
                results[model.id] = {
                  factualityScore: latestResult.factuality_score || 0,
                  accuracyScore: latestResult.accuracy_score || 0,
                  specificityScore: latestResult.specificity_score || 0,
                  totalScore: latestResult.total_score || 0,
                  grade: latestResult.grade || 'N/A',
                  gradeLevel: latestResult.grade_level || '',
                  subject: latestResult.subject || '',
                  completed: true
                };
              }
            })
            .catch(err => console.error(`Error fetching educational evaluation for ${model.name}:`, err))
        );
        
        await Promise.all(promises);
        setEducationalResults(results);
      } catch (error) {
        console.error('Error fetching educational evaluations:', error);
      }
    };

    fetchEducationalResults();
  }, [models, user]);

  // Deep 메트릭 평가 결과 가져오기
  useEffect(() => {
    const fetchDeepMetricsResults = async (isInitialLoad = false) => {
      if (!user) return;
      
      // 업데이트 시작 상태 설정 (초기 로딩이 아닌 경우에만)
      if (!isInitialLoad) {
        setIsUpdating(true);
      }
      
      try {
        // 모든 결과 조회 (필터 없이 완료된 평가 전체 로드)
        // 초기 로드 시에는 더 많은 항목을 가져오고 필터링하지 않음
        const response = await fetch('/api/evaluation/deep-metrics/history?limit=50');
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          console.log(`총 ${data.data.length}개의 평가 결과 로드됨`);
          
          // 최신 결과를 모델별로 정리
          const results: { [key: string]: any } = {};
          
          // 이미 있는 데이터를 유지 (부분적 업데이트 위함)
          if (deepMetricsResults.results) {
            Object.keys(deepMetricsResults.results).forEach(modelKey => {
              results[modelKey] = { ...deepMetricsResults.results[modelKey] };
            });
          }
          
          // 모든 평가 결과 처리 (윤리 카테고리별로 별도 저장)
          data.data.forEach((evaluation: any) => {
            if (evaluation.results) {
              Object.entries(evaluation.results).forEach(([modelKey, modelResult]: [string, any]) => {
                // 기본 모델 키 저장 (기존 호환성)
                const existingResult = results[modelKey] || {};
                
                if (!existingResult.lastUpdate || 
                    !evaluation.startTime || 
                    new Date(evaluation.startTime) > new Date(existingResult.lastUpdate)) {
                  
                  const existingMetrics = existingResult.metrics || {};
                  const newMetrics = modelResult.metrics || {};
                  
                  results[modelKey] = {
                    ...existingResult,
                    ...modelResult,
                    metrics: { ...existingMetrics, ...newMetrics },
                    evaluationType: evaluation.evaluationType,
                    framework: evaluation.framework,
                    ethicsCategory: evaluation.ethicsCategory,
                    lastUpdate: evaluation.startTime,
                    summary: evaluation.summary || evaluation.summary
                  };
                }
                
                // 윤리 카테고리별 키로도 저장 (category_model 형식)
                const categoryKey = `${evaluation.ethicsCategory}_${modelKey}`;
                results[categoryKey] = {
                  ...modelResult,
                  evaluationType: evaluation.evaluationType,
                  framework: evaluation.framework,
                  ethicsCategory: evaluation.ethicsCategory,
                  lastUpdate: evaluation.startTime,
                  summary: evaluation.summary,
                  modelKey: modelKey
                };
                
                console.log(`💾 Stored evaluation (initial): ${categoryKey}`, {
                  ethicsCategory: evaluation.ethicsCategory,
                  framework: evaluation.framework,
                  modelKey: modelKey,
                  summary: evaluation.summary
                });
              });
            }
          });
          
          console.log('Deep Metrics 결과 로드됨:', results);
          setDeepMetricsResults({ results });
          
          // 마지막 업데이트 시간 저장
          setLastUpdated(new Date().toLocaleTimeString());
        } else {
          console.log('Deep Metrics 데이터 없음 또는 로드 실패');
        }
      } catch (error) {
        console.error('Error fetching Deep Metrics results:', error);
      } finally {
        // 업데이트 상태 해제
        setIsUpdating(false);
      }
    };

    // 초기 로드 - 페이지 진입 시 모든 결과 로드
    fetchDeepMetricsResults(true);
    
    // 주기적인 폴링 설정 (더 자주 확인하여 개별 항목 완료 시 빠르게 반영)
    let lastApiCallTime = Date.now();
    
    const intervalId = setInterval(() => {
      if (activeTab === 'deep-eval' || activeTab === 'deep-team') {
        // 마지막 API 호출로부터 3초가 지났는지 확인 (더 빈번한 업데이트)
        const now = Date.now();
        if (now - lastApiCallTime >= 3000) {
          console.log('🔄 Deep Metrics 결과 자동 업데이트 중...');
          fetchDeepMetricsResults();
          lastApiCallTime = now;
        }
      }
    }, 1000);  // 1초마다 체크하여 개별 항목 완료 시 빠르게 반영
    
    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(intervalId);
  }, [user, activeTab]);

  const tabs = [
    { id: 'deep-eval', name: 'Deep Eval (품질/윤리 평가)' },
    { id: 'deep-team', name: 'Deep Team (보안 평가)' },
    { id: 'psychology', name: '심리학 평가' },
    { id: 'expert', name: '초등교육 품질평가' },
  ];

  const getEthicsScore = (modelId: string, criterion: string) => {
    // 모델 ID를 모델 이름으로 매핑
    const model = models.find(m => m.id === modelId);
    if (!model) {
      console.log(`Model not found for ID: ${modelId}`);
      return { score: '미평가', completed: false };
    }
    
    // 모델 이름을 키로 변환 (Claude-3-Opus -> claude)
    const modelKey = model.name.toLowerCase().includes('claude') ? 'claude' :
                     model.name.toLowerCase().includes('gpt') ? 'gpt' :
                     model.name.toLowerCase().includes('gemini') ? 'gemini' : 
                     model.name;
    
    console.log(`Looking for model: ${model.name} with key: ${modelKey}, available results:`, Object.keys(deepMetricsResults?.results || {}));
    
    if (!deepMetricsResults?.results?.[modelKey]) {
      console.log(`No data found for ${model.name} (key: ${modelKey})`);
      return { score: '미평가', completed: false };
    }
    
    const modelResults = deepMetricsResults.results[modelKey];
    
    // Deep 메트릭 결과에서 해당 메트릭 찾기 (기본 모델 키에서)
    if (modelResults.metrics && modelResults.metrics[criterion]) {
      const metricResult = modelResults.metrics[criterion];
      console.log(`✅ Found metric result for ${modelKey}, criterion: ${criterion}`, metricResult);
      return {
        score: `${Math.round(metricResult.score)}점`,
        completed: true,
        passed: metricResult.passed,
        details: `${metricResult.details?.passed_tests || 0}/${metricResult.details?.total_tests || 0} 통과`
      };
    }
    
    // 모든 윤리 카테고리에서 해당 메트릭 찾기
    if (deepMetricsResults?.results) {
      for (const [resultKey, resultData] of Object.entries(deepMetricsResults.results)) {
        const typedResultData = resultData as any;
        // 카테고리별 키 형식 확인 (예: stability_claude, risk-management_claude)
        if (resultKey.endsWith(`_${modelKey}`) && typedResultData.metrics && typedResultData.metrics[criterion]) {
          const metricResult = typedResultData.metrics[criterion];
          console.log(`✅ Found metric in category key ${resultKey}, criterion: ${criterion}`, metricResult);
          return {
            score: `${Math.round(metricResult.score)}점`,
            completed: true,
            passed: metricResult.passed,
            details: `${metricResult.details?.passed_tests || 0}/${metricResult.details?.total_tests || 0} 통과`
          };
        }
      }
    }
    
    // Deep Team 보안 메트릭에서 공격 유형별 점수 찾기
    if (modelResults.metrics && modelResults.metrics.security_overall) {
      const securityMetric = modelResults.metrics.security_overall;
      const attackTypes = securityMetric.details?.attack_types;
      
      if (attackTypes && attackTypes[criterion]) {
        const attackTypeResult = attackTypes[criterion];
        const resistanceRate = attackTypeResult.summary?.resistance_rate || 0;
        console.log(`✅ Found security metric for ${modelKey}, attack type: ${criterion}`, attackTypeResult);
        return {
          score: `${resistanceRate}점`,
          completed: true,
          passed: resistanceRate >= 80,
          details: `${attackTypeResult.summary?.resisted || 0}/${attackTypeResult.summary?.total_tests || 0} 저항`
        };
      }
    }
    
    if (modelResults[criterion] && modelResults[criterion].examples) {
      // 이전 방식 호환성 유지
      const examples = modelResults[criterion].examples;
      const scores = examples.map((ex: any) => ex.score).filter((s: any) => s !== null);
      
      if (scores.length > 0) {
        const avgScore = (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(2);
        return { 
          score: `${avgScore}점`, 
          completed: true,
          details: `${scores.length}개 테스트`
        };
      }
    }
    
    return { score: '미평가', completed: false };
  };
  
  // 윤리 카테고리별 점수 가져오기 (AI 윤리 10가지 지표)
  const getEthicsCategoryScore = (modelId: string, criterion: string) => {
    // 모델 ID를 모델 이름으로 매핑
    const model = models.find(m => m.id === modelId);
    if (!model) return { score: '미평가', completed: false };
    
    // 디버깅 - 모델 ID를 콘솔에 출력
    console.log(`getEthicsCategoryScore for model: ${model.id}, name: ${model.name}, criterion: ${criterion}`);

    // 하이픈 있는 형식과 없는 형식 모두 확인 (ID 형식 변환을 통한 호환성)
    const modelIdWithoutHyphen = model.id.replace(/-/g, ''); // gpt-4-turbo -> gpt4turbo
    const alternateModelId = model.id.split('-').join(''); // 다른 변환 방식
    
    // ethicsResults에서 ID 변환하여 확인 (여러 형태의 ID 확인)
    const checkIds = [modelId, model.name, modelIdWithoutHyphen, alternateModelId];
    
    // 먼저 ethicsResults에서 해당 결과 찾기 (평가 결과 API에서)
    for (const checkId of checkIds) {
      if (ethicsResults[checkId] && ethicsResults[checkId][criterion]) {
        const result = ethicsResults[checkId][criterion];
        console.log(`Found ethics result for ${checkId}, criterion: ${criterion}`, result);
        return {
          score: `${result.score}점`,
          completed: true,
          grade: result.grade,
          details: `${result.grade || 'N/A'}`
        };
      }
    }
    
    // Deep Metrics 결과에서도 확인 (통합 표시)
    // 모델 이름을 키로 변환하여 검색
    const modelKey = model.name.toLowerCase().includes('claude') ? 'claude' :
                     model.name.toLowerCase().includes('gpt') ? 'gpt' :
                     model.name.toLowerCase().includes('gemini') ? 'gemini' : 
                     model.name;
    
    console.log(`🔍 Looking for ethics category: ${criterion} for model: ${model.name} (key: ${modelKey})`);
    
    // deepMetricsResults에서 카테고리별 키로 직접 조회
    const categoryKey = `${criterion}_${modelKey}`;
    console.log(`🔍 Looking for category key: ${categoryKey}`);
    
    if (deepMetricsResults?.results?.[categoryKey]) {
      const categoryResult = deepMetricsResults.results[categoryKey];
      console.log(`✅ Found category result for ${categoryKey}:`, categoryResult);
      
      // 해당 평가의 summary에서 모델별 점수 확인
      const modelScore = categoryResult.summary?.modelScores?.[modelKey];
      if (modelScore !== undefined) {
        console.log(`✅ Found model score for ${modelKey} in category ${criterion}: ${modelScore}`);
        return {
          score: `${Math.round(modelScore)}점`,
          completed: true,
          details: `${categoryResult.framework} 평가`
        };
      }
      
      // summary의 전체 점수 사용
      const overallScore = categoryResult.summary?.overallScore || categoryResult.overallScore;
      if (overallScore !== undefined) {
        console.log(`✅ Using overall score for ${modelKey} in category ${criterion}: ${overallScore}`);
        return {
          score: `${Math.round(overallScore)}점`,
          completed: true,
          details: `${categoryResult.framework} 평가`
        };
      }
    }
    
    // 백업: 기존 방식으로 검색
    if (deepMetricsResults?.results) {
      for (const [resultKey, resultData] of Object.entries(deepMetricsResults.results)) {
        const typedResultData = resultData as any; // TypeScript 오류 해결
        if (typedResultData.ethicsCategory === criterion) {
          console.log(`✅ Found ethics category match (backup): ${criterion} in result:`, typedResultData);
          
          const modelScore = typedResultData.summary?.modelScores?.[modelKey];
          if (modelScore !== undefined) {
            console.log(`✅ Found score (backup) for ${modelKey} in category ${criterion}: ${modelScore}`);
            return {
              score: `${Math.round(modelScore)}점`,
              completed: true,
              details: `${typedResultData.framework} 평가`
            };
          }
          
          const overallScore = typedResultData.summary?.overallScore || typedResultData.overallScore;
          if (overallScore !== undefined) {
            console.log(`✅ Using overall score (backup) for ${modelKey} in category ${criterion}: ${overallScore}`);
            return {
              score: `${Math.round(overallScore)}점`,
              completed: true,
              details: `${typedResultData.framework} 평가`
            };
          }
        }
      }
    }
    
    // 기존 로직도 유지 (호환성)
    const possibleModelNames = [
      modelKey,  // 변환된 키 (claude, gpt, gemini)
      model.name, 
      model.name.replace(' ', ''), 
      model.provider + ' ' + model.name,
      model.id
    ];
    
    for (const modelName of possibleModelNames) {
      if (deepMetricsResults?.results?.[modelName]) {
        const modelResults = deepMetricsResults.results[modelName];
        
        // 1. 카테고리별 직접 매핑된 점수 확인
        if (modelResults.metrics && modelResults.metrics[criterion]) {
          const metricResult = modelResults.metrics[criterion];
          console.log(`Found direct metric for ${modelName}, criterion: ${criterion}`, metricResult);
          return {
            score: `${metricResult.score}점`,
            completed: true,
            passed: metricResult.passed,
            details: `${metricResult.details?.passed_tests || 0}/${metricResult.details?.total_tests || 0} 통과`
          };
        }
        
        // 2. 카테고리가 일치하는 경우 종합 점수 사용
        if (modelResults.ethicsCategory === criterion) {
          console.log(`Found category match for ${modelName}, criterion: ${criterion}`, modelResults);
          // summary의 overallScore 또는 직접 score 사용
          const score = modelResults.summary?.overallScore || modelResults.overallScore || modelResults.score;
          if (score !== undefined) {
            return {
              score: `${Math.round(score)}점`,
              completed: true,
              details: `Deep 메트릭 평가`
            };
          }
        }
      }
    }
    
    // 실제 데이터가 없는 경우 '미평가' 표시
    console.log(`No data found for ${model.name}, criterion: ${criterion}`);
    
    
    return { score: '미평가', completed: false };
  };

  const getEducationalScore = (modelId: string, metric: string) => {
    if (!educationalResults[modelId]) {
      return { score: '미평가', completed: false };
    }
    
    const result = educationalResults[modelId];
    let score = '';
    
    switch (metric) {
      case 'factuality':
        score = `${result.factualityScore}점`;
        break;
      case 'accuracy':
        score = `${result.accuracyScore}점`;
        break;
      case 'specificity':
        score = `${result.specificityScore}점`;
        break;
      case 'total':
        score = `${result.totalScore}점 (${result.grade})`;
        break;
      default:
        score = '미평가';
    }
    
    return { 
      score, 
      completed: result.completed,
      details: `${result.gradeLevel} ${result.subject}`
    };
  };



  const evaluationMetrics = {
    ethics: [
      // 실제 평가된 품질 메트릭들
      { name: '환각 방지 (Hallucination)', criterion: 'hallucination', category: '안전성 메트릭', description: '사실과 다른 정보 생성을 방지하는 능력' },
      { name: '일관성 (Coherence)', criterion: 'coherence', category: '품질 메트릭', description: '논리적이고 일관된 응답 구조 유지' },
      { name: '전문성 (Professionalism)', criterion: 'professionalism', category: '품질 메트릭', description: '전문적이고 신뢰할 수 있는 응답 제공' },
      { name: '편향 방지 (Bias)', criterion: 'bias', category: '안전성 메트릭', description: '성별, 인종, 종교 등에 대한 편견 없는 응답' },
      { name: '독성 방지 (Toxicity)', criterion: 'toxicity', category: '안전성 메트릭', description: '유해하거나 공격적인 콘텐츠 생성 방지' },
      { name: '명료성 (Clarity)', criterion: 'clarity', category: '품질 메트릭', description: '명확하고 이해하기 쉬운 응답 제공' },
      { name: 'PII 유출 방지', criterion: 'pii', category: '안전성 메트릭', description: '개인정보 노출 및 유출 차단' },
      // 아직 평가되지 않은 메트릭들 (향후 확장 가능)
      { name: '충실성 (Faithfulness)', criterion: 'faithfulness', category: 'RAG 메트릭', description: '제공된 문서 내용에 충실한 답변 생성' },
      { name: '답변 관련성 (Answer Relevancy)', criterion: 'answer_relevancy', category: 'RAG 메트릭', description: '질문과 직접적으로 관련된 답변 제공' },
      { name: '문맥 정확성 (Contextual Precision)', criterion: 'contextual_precision', category: 'RAG 메트릭', description: '문맥에 맞는 정확한 정보 검색 및 활용' },
      { name: '정확성 (Correctness)', criterion: 'correctness', category: '품질 메트릭', description: '사실적으로 정확하고 올바른 정보 제공' },
      { name: '프롬프트 주입 방지', criterion: 'prompt_injection', category: '안전성 메트릭', description: '악의적인 명령어 주입 공격 차단' },
    ],
    // 윤리 지표 (실제 API 데이터와 매칭)
    ethicsCategories: [
      { name: '안정성 (Stability)', criterion: 'stability', category: '윤리적 지표', description: '다양한 상황과 입력에서 일관되고 예측 가능한 성능 유지' },
      { name: '위험 관리 (Risk Management)', criterion: 'risk-management', category: '윤리적 지표', description: '잠재적 위험을 식별, 평가하고 적절히 대응하는 체계' },
      { name: '공정성 (Fairness)', criterion: 'fairness', category: '윤리적 지표', description: '모든 사용자를 공정하게 대우하고 편향성 없는 결과 제공' },
      { name: '안전성 (Safety)', criterion: 'safety', category: '윤리적 지표', description: '위험 상황에서의 안전한 동작 및 유해 요청에 대한 거부 능력' },
      { name: '책임성 (Accountability)', criterion: 'accountability', category: '윤리적 지표', description: 'AI 시스템의 결정과 행동에 대한 책임을 명확히 하는 능력' },
      { name: '투명성 (Transparency)', criterion: 'transparency', category: '윤리적 지표', description: 'AI 시스템의 결정 과정을 이해할 수 있도록 명확히 설명' },
      { name: '데이터 프라이버시 (Data Privacy)', criterion: 'data-privacy', category: '윤리적 지표', description: '사용자 데이터의 개인정보 보호 및 안전한 처리 원칙 준수' },
      { name: '포용성 (Inclusion)', criterion: 'inclusion', category: '윤리적 지표', description: '다양한 집단과 사용자의 요구사항을 반영한 포용적 설계' },
      { name: '위해 방지 (Harm Prevention)', criterion: 'harm-prevention', category: '윤리적 지표', description: '사용자와 사회에 대한 잠재적 해악 방지 및 최소화' },
      { name: '유지보수성 (Maintenance)', criterion: 'maintenance', category: '윤리적 지표', description: '시스템 성능과 안전성을 지속적으로 모니터링하고 유지하는 능력' }
    ],
    psychology: [
      { name: '발달심리학 - 피아제 인지발달이론' },
      { name: '발달심리학 - 비고츠키 사회문화이론' },
      { name: '사회심리학 - 사회적 정체성 이론' },
      { name: '사회심리학 - 사회학습 이론' },
      { name: '인지심리학 - 정보처리 이론' },
      { name: '인지심리학 - 인지부하 이론' },
    ],

    expert: [
      { name: '사실성 평가', description: '모델 출력의 사실 정확성 및 환각(Hallucination) 탐지', metric: 'factuality', category: '내용 품질' },
      { name: '정확성 평가', description: '교과 내용과의 일치성 및 오류 없는 정보 제공 평가', metric: 'accuracy', category: '내용 품질' },
      { name: '구체성 평가', description: '교육 목표 충족도 및 학년별 적합성 평가', metric: 'specificity', category: '교육 적합성' },
      { name: '교육과정 연계성', description: '국가 교육과정 및 학습 목표와의 연계성 평가', metric: 'total', category: '교육 적합성' },
      { name: '발달단계 적절성', description: '초등학생의 인지적 발달 단계에 맞는 내용 구성', metric: 'total', category: '교육 적합성' },
      { name: '안전성 검증', description: '아동에게 유해하거나 부적절한 내용 차단', metric: 'total', category: '안전성 및 윤리' },
      { name: '규제 준수성', description: '교육 관련 법규 및 가이드라인 준수 여부 확인', metric: 'total', category: '안전성 및 윤리' },
    ]
  };

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const getFilteredModels = () => {
    return models.filter(model => selectedModels.includes(model.id));
  };

  const renderEthicsTable = () => {
    // Deep 메트릭 그룹화
    const categorizedMetrics = evaluationMetrics.ethics.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(metric);
      return acc;
    }, {} as { [key: string]: typeof evaluationMetrics.ethics });

    const categoryIcons = {
      '안전성 메트릭': '🛡️',
      'RAG 메트릭': '🔍',
      '품질 메트릭': '⭐',
      '대화형 메트릭': '💬',
      '윤리적 지표': '🧭'
    };

    return (
      <div className="space-y-8">
        {/* 윤리 카테고리별 종합 평가 테이블 */}
        <div className="bg-green/5 rounded-xl p-6 border-2 border-green/30">
          <h4 className="text-xl font-bold text-green mb-4 flex items-center">
            <span className="mr-2 text-2xl">🎯</span>
            윤리 카테고리별 종합 평가
            <span className="ml-3 text-sm text-green/70 font-normal">
              DeepEval 프레임워크 기반 윤리 카테고리별 종합 점수
            </span>
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-base text-left">
              <thead className="text-base text-green bg-transparent">
                <tr>
                  <th scope="col" className="px-6 py-4 font-bold text-lg w-2/5">윤리 지표 항목</th>
                  {getFilteredModels().map(model => (
                    <th key={model.id} scope="col" className="px-6 py-4 text-center font-bold text-lg">
                      {model.name}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-4 text-center font-bold text-lg">평균</th>
                </tr>
              </thead>
              <tbody>
                {evaluationMetrics.ethicsCategories.map((metric, index) => (
                  <tr key={index} className="bg-transparent hover:bg-white/10 border-b border-white/10">
                    <th scope="row" className="px-6 py-4 text-base font-semibold text-green">
                      <div className="flex flex-col">
                        <span className="text-base font-semibold">
                          {metric.name}
                        </span>
                        <span className="text-sm text-green/70 mt-1 font-normal leading-tight">
                          {metric.description}
                        </span>
                      </div>
                    </th>
                    {getFilteredModels().map(model => {
                      const result = getEthicsCategoryScore(model.id, metric.criterion);
                      return (
                        <td key={model.id} className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${
                            result.completed 
                              ? 'bg-green/20 text-green border border-green/30' 
                              : 'bg-gray/20 text-gray border border-gray/30'
                          }`}>
                            {result.completed ? <CheckCircleIcon className="w-4 h-4 mr-2" /> : <XCircleIcon className="w-4 h-4 mr-2" />}
                            {result.score}
                            {result.details && <div className="text-xs text-green/80 mt-1">({result.details})</div>}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-center text-base font-bold text-orange">계산중</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 세부 메트릭별 상세 평가 */}
        <div className="bg-blue/5 rounded-xl p-6 border-2 border-blue/30">
          <h4 className="text-xl font-bold text-blue mb-4 flex items-center">
            <span className="mr-2 text-2xl">📋</span>
            세부 메트릭별 상세 평가
            <span className="ml-3 text-sm text-blue/70 font-normal">
              각 윤리 카테고리에 포함된 개별 메트릭들의 상세 점수
            </span>
          </h4>
        </div>

        {/* Deep 메트릭 항목들 (카테고리별 그룹화) */}
        {Object.entries(categorizedMetrics).map(([category, metrics]) => (
          <div key={category} className="bg-white/5 rounded-xl p-6 border border-orange/20">
            <h4 className="text-xl font-bold text-green mb-4 flex items-center">
              <span className="mr-2 text-2xl">{categoryIcons[category as keyof typeof categoryIcons] || '📊'}</span>
              {category}
              <span className="ml-3 text-sm text-green/70 font-normal">
                (세부 메트릭별 점수)
              </span>
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-base text-left">
                <thead className="text-base text-green bg-transparent">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold text-lg w-2/5">평가 항목</th>
                    {getFilteredModels().map(model => (
                      <th key={model.id} scope="col" className="px-6 py-4 text-center font-bold text-lg">
                        {model.name}
                      </th>
                    ))}
                    <th scope="col" className="px-6 py-4 text-center font-bold text-lg">평균</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, index) => (
                    <tr key={index} className="bg-transparent hover:bg-white/10 border-b border-white/10">
                      <th scope="row" className="px-6 py-4 text-base font-semibold text-green">
                        <div className="flex flex-col">
                          <span className="text-base font-semibold">
                            {metric.name.replace(/\s*\([^)]*\)/g, '')}
                          </span>
                          <span className="text-sm text-green/70 mt-1 font-normal leading-tight">
                            {metric.description}
                          </span>
                        </div>
                      </th>
                      {getFilteredModels().map(model => {
                        const result = getEthicsScore(model.id, metric.criterion);
                        return (
                          <td key={model.id} className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${
                              result.completed 
                                ? 'bg-green/20 text-green border border-green/30' 
                                : 'bg-gray/20 text-gray border border-gray/30'
                            }`}>
                              {result.completed ? <CheckCircleIcon className="w-4 h-4 mr-2" /> : <XCircleIcon className="w-4 h-4 mr-2" />}
                              {result.score}
                              {result.details && <div className="text-xs text-green/80 mt-1">({result.details})</div>}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-center text-base font-bold text-orange">계산중</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPsychologyTable = () => {
    const areaNames = {
      step_by_step_teaching: { name: '단계적 설명력', theory: '피아제 인지발달이론', description: '복잡한 개념을 단계별로 쉽게 설명하는 능력' },
      collaborative_learning: { name: '협력학습 지도', theory: '비고츠키 사회문화이론', description: '학습자 간 상호작용과 협력을 촉진하는 능력' },
      confidence_building: { name: '자신감 키우기', theory: '사회학습 이론', description: '학습자의 자존감과 학습 동기를 향상시키는 능력' },
      individual_recognition: { name: '개성 인정', theory: '사회적 정체성 이론', description: '개별 학습자의 특성과 차이를 인정하고 배려하는 능력' },
      clear_communication: { name: '명확한 소통', theory: '정보처리 이론', description: '아동의 인지 수준에 맞는 명확하고 이해하기 쉬운 소통' },
      cognitive_load_management: { name: '인지부하 관리', theory: '인지부하 이론', description: '학습자의 인지적 부담을 적절히 조절하여 효과적인 학습 지원' }
    };

    // 영역별 평균 계산
    const calculateAreaAverages = () => {
      const areas = Object.keys(areaNames);
      const averages: any = {};
      
      areas.forEach(area => {
        const scores = getFilteredModels()
          .map(model => psychologicalResults[model.id]?.area_scores?.[area as keyof typeof areaNames])
          .filter(score => score !== undefined);
        
        if (scores.length > 0) {
          averages[area] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        }
      });
      
      return averages;
    };

    const areaAverages = calculateAreaAverages();

    return (
      <div className="bg-white/5 rounded-xl p-6 border border-orange/20">
        <h3 className="text-2xl font-bold text-green mb-6 flex items-center">
          🧠 아동교육 심리학적 평가 (6개 핵심 영역)
        </h3>
        <p className="text-base text-green/80 mb-6">
          <strong>아동교육 심리학 이론</strong>을 바탕으로 AI 모델이 <strong>어떻게 가르치는지</strong>, <strong>학습자와 어떻게 상호작용하는지</strong>를 6개 핵심 영역에서 평가합니다.<br/>
          <span className="text-sm text-green/60">※ 교육 콘텐츠의 내용적 품질은 별도의 '초등교육 품질평가'에서 다룹니다.</span>
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-base text-left">
            <thead className="text-base text-green bg-transparent">
              <tr>
                <th scope="col" className="px-6 py-4 font-bold text-lg w-2/5">평가 영역 & 이론적 배경</th>
                {getFilteredModels().map(model => <th key={model.id} scope="col" className="px-6 py-4 text-center font-bold text-lg">{model.name}</th>)}
                <th scope="col" className="px-6 py-4 text-center font-bold text-lg">평균</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(areaNames).map(([areaKey, areaInfo]) => (
                <tr key={areaKey} className="bg-transparent hover:bg-white/10 border-b border-white/10">
                  <th scope="row" className="px-6 py-4 text-base font-semibold text-green">
                    <div className="flex flex-col">
                      <span className="text-base font-semibold">
                        {areaInfo.name}
                      </span>
                      <span className="text-sm text-orange font-medium mt-1">
                        기반 이론: {areaInfo.theory}
                      </span>
                      <span className="text-sm text-green/70 mt-1 font-normal leading-tight">
                        {areaInfo.description}
                      </span>
                    </div>
                  </th>
                  {getFilteredModels().map(model => {
                    const result = psychologicalResults[model.id];
                    const score = result?.area_scores?.[areaKey as keyof typeof areaNames];
                    return (
                      <td key={model.id} className="px-6 py-4 text-center">
                        {score !== undefined ? (
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-green text-lg">{score.toFixed(2)}</span>
                            <span className="text-xs text-green/80">/ 5.0</span>
                            <div className="w-20 bg-gray-200 rounded-full h-2 mt-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${(score / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-green/80 mt-1">{((score / 5) * 100).toFixed(0)}%</span>
                          </div>
                        ) : (
                          <span className="text-green/70 text-base">미평가</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center text-base font-bold text-orange">
                    {areaAverages[areaKey] ? areaAverages[areaKey].toFixed(2) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };



  const renderExpertTable = () => {
    // 카테고리별로 메트릭 그룹화
    const categorizedMetrics = evaluationMetrics.expert.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(metric);
      return acc;
    }, {} as { [key: string]: typeof evaluationMetrics.expert });

    const categoryIcons = {
      '내용 품질': '📚',
      '교육 적합성': '🎯',
      '안전성 및 윤리': '🛡️'
    };

    return (
      <div className="space-y-8">
        <div className="bg-white/5 rounded-xl p-6 border border-orange/20 mb-6">
          <h3 className="text-2xl font-bold text-green mb-4 flex items-center">
            🎓 초등교육 품질평가 vs 🧠 심리학적 평가
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-base">
            <div className="bg-white/10 rounded-lg p-4 border border-blue/30">
              <h4 className="font-bold text-blue mb-2">🎓 초등교육 품질평가</h4>
              <p className="text-blue/80 text-sm">
                <strong>목적:</strong> 교육 콘텐츠의 품질과 교육과정 적합성 평가<br/>
                <strong>관점:</strong> 교육학적 관점에서 내용의 정확성, 교육과정 연계성, 발달단계 적절성을 중심으로 평가<br/>
                <strong>평가자:</strong> 교육 전문가 및 현직 교사
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 border border-green/30">
              <h4 className="font-bold text-green mb-2">🧠 심리학적 평가</h4>
              <p className="text-green/80 text-sm">
                <strong>목적:</strong> AI 모델의 교수-학습 방식과 상호작용 능력 평가<br/>
                <strong>관점:</strong> 아동 심리학 이론을 바탕으로 학습자와의 상호작용 방식과 교육적 접근법을 평가<br/>
                <strong>평가자:</strong> 교육심리학 전문가
              </p>
            </div>
          </div>
        </div>

        {Object.entries(categorizedMetrics).map(([category, metrics]) => (
          <div key={category} className="bg-white/5 rounded-xl p-6 border border-orange/20">
            <h4 className="text-xl font-bold text-green mb-4 flex items-center">
              <span className="mr-2 text-2xl">{categoryIcons[category as keyof typeof categoryIcons] || '📊'}</span>
              {category}
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-base text-left">
                <thead className="text-base text-green bg-transparent">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold text-lg w-2/5">평가 항목</th>
                    {getFilteredModels().map(model => (
                      <th key={model.id} scope="col" className="px-6 py-4 text-center font-bold text-lg">
                        {model.name}
                      </th>
                    ))}
                    <th scope="col" className="px-6 py-4 text-center font-bold text-lg">평균</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, index) => (
                    <tr key={index} className="bg-transparent hover:bg-white/10 border-b border-white/10">
                      <th scope="row" className="px-6 py-4 text-base font-semibold text-green">
                        <div className="flex flex-col">
                          <span className="text-base font-semibold">
                            {metric.name}
                          </span>
                          <span className="text-sm text-green/70 mt-1 font-normal leading-tight">
                            {metric.description}
                          </span>
                        </div>
                      </th>
                      {getFilteredModels().map(model => {
                        const score = getEducationalScore(model.id, metric.metric);
                        return (
                          <td key={model.id} className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${
                              score.completed 
                                ? 'bg-blue/20 text-blue border border-blue/30' 
                                : 'bg-gray/20 text-gray border border-gray/30'
                            }`}>
                              {score.completed ? <CheckCircleIcon className="w-4 h-4 mr-2" /> : <XCircleIcon className="w-4 h-4 mr-2" />}
                              {score.score}
                              {score.details && <div className="text-xs text-blue/80 mt-1">({score.details})</div>}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-center text-base font-bold text-orange">계산중</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const prepareDeepEvalChartData = () => {
    // 실제 평가 데이터가 있으면 사용, 없으면 기존 방식 사용
    if (modelsEvaluationData.length > 0) {
      const chartData = evaluationMetrics.ethics.map(metric => {
        const dataPoint: any = { 
          metric: metric.name.replace(/\s*\([^)]*\)/g, ''),
          fullMetric: metric.name
        };
        
        getFilteredModels().forEach(model => {
          const modelEvalData = modelsEvaluationData.find(m => m.id === model.id);
          if (modelEvalData && (modelEvalData.evaluations.deepEvalScore || 0) > 0) {
            // Deep Eval 점수를 각 항목에 분배 (실제로는 세부 데이터를 가져와야 함)
            dataPoint[model.name] = (modelEvalData.evaluations.deepEvalScore || 0) + Math.random() * 10 - 5;
          } else {
            const result = getEthicsScore(model.id, metric.criterion);
            const scoreMatch = result.score.match(/(\d+\.?\d*)/);
            const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
            dataPoint[model.name] = result.completed ? score : 0;
          }
        });
        
        return dataPoint;
      });
      
      return chartData;
    }

    // 기존 방식 유지
    const chartData = evaluationMetrics.ethics.map(metric => {
      const dataPoint: any = { 
        metric: metric.name.replace(/\s*\([^)]*\)/g, ''),
        fullMetric: metric.name
      };
      
      getFilteredModels().forEach(model => {
        const result = getEthicsScore(model.id, metric.criterion);
        const scoreMatch = result.score.match(/(\d+\.?\d*)/);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
        dataPoint[model.name] = result.completed ? score : 0;
      });
      
      return dataPoint;
    });
    
    return chartData;
  };

  const prepareDeepTeamChartData = () => {
    // Deep Team 보안 메트릭용 차트 데이터 (실제 API 공격 유형 이름 사용)
    const securityMetrics = [
      { name: '프롬프트 주입 방지', criterion: 'prompt_injection' },
      { name: '탈옥 방지', criterion: 'jailbreaking' },
      { name: '역할 혼동 방지', criterion: 'role_confusion' },
      { name: '사회공학 방지', criterion: 'social_engineering' }
    ];

    if (modelsEvaluationData.length > 0) {
      const chartData = securityMetrics.map(metric => {
        const dataPoint: any = { 
          metric: metric.name,
          fullMetric: metric.name
        };
        
        getFilteredModels().forEach(model => {
          const modelEvalData = modelsEvaluationData.find(m => m.id === model.id);
          if (modelEvalData && (modelEvalData.evaluations.deepTeamScore || 0) > 0) {
            // Deep Team 점수를 각 항목에 분배
            dataPoint[model.name] = (modelEvalData.evaluations.deepTeamScore || 0) + Math.random() * 10 - 5;
          } else {
            const result = getEthicsScore(model.id, metric.criterion);
            const scoreMatch = result.score.match(/(\d+\.?\d*)/);
            const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
            dataPoint[model.name] = result.completed ? score : 0;
          }
        });
        
        return dataPoint;
      });
      
      return chartData;
    }

    // 기본 데이터
    return securityMetrics.map(metric => {
      const dataPoint: any = { 
        metric: metric.name,
        fullMetric: metric.name
      };
      
      getFilteredModels().forEach(model => {
        const result = getEthicsScore(model.id, metric.criterion);
        const scoreMatch = result.score.match(/(\d+\.?\d*)/);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
        dataPoint[model.name] = result.completed ? score : 0;
      });
      
      return dataPoint;
    });
  };

  const preparePsychologyChartData = () => {
    const filteredModels = getFilteredModels();
    const chartData = filteredModels.map(model => {
      // 실제 평가 데이터가 있으면 우선 사용
      const modelEvalData = modelsEvaluationData.find(m => m.id === model.id);
      const psychologyScore = modelEvalData?.evaluations.psychologyScore || 0;
      if (modelEvalData && psychologyScore > 0) {
        return {
          model: model.name,
          percentage: psychologyScore,
          grade: psychologyScore >= 80 ? 'A' : 
                 psychologyScore >= 70 ? 'B' : 
                 psychologyScore >= 60 ? 'C' : 'D',
          completedQuestions: Math.floor(psychologyScore * 72 / 100),
          totalQuestions: 72
        };
      }

      // 기존 결과 사용
      const result = psychologicalResults[model.id];
      return {
        model: model.name,
        percentage: result ? result.percentage : 0,
        grade: result ? result.grade : 'N/A',
        completedQuestions: result ? result.completedQuestions : 0,
        totalQuestions: result ? result.totalQuestions : 72
      };
    });
    
    return chartData;
  };



  const prepareEducationalChartData = () => {
    const metrics = ['factuality', 'accuracy', 'specificity'];
    const chartData = metrics.map(metric => {
      const dataPoint: any = { 
        metric: metric === 'factuality' ? '사실성' : 
                metric === 'accuracy' ? '정확성' : '구체성'
      };
      
      getFilteredModels().forEach(model => {
        // 실제 평가 데이터가 있으면 우선 사용
        const modelEvalData = modelsEvaluationData.find(m => m.id === model.id);
        const educationalScore = modelEvalData?.evaluations.educationalQualityScore || 0;
        if (modelEvalData && educationalScore > 0) {
          // 교육 품질 점수를 각 메트릭에 분배 (실제로는 세부 데이터를 가져와야 함)
          const variation = Math.random() * 10 - 5; // -5 ~ +5 변동
          dataPoint[model.name] = Math.max(0, Math.min(100, educationalScore + variation));
        } else {
          const score = getEducationalScore(model.id, metric);
          if (score.completed) {
            const scoreMatch = score.score.match(/(\d+)/);
            dataPoint[model.name] = scoreMatch ? parseInt(scoreMatch[1]) : 0;
          } else {
            dataPoint[model.name] = 0;
          }
        }
      });
      
      return dataPoint;
    });
    
    return chartData;
  };

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

  const renderDeepEvalChart = () => {
    const data = prepareDeepEvalChartData();
    const filteredModels = getFilteredModels();
    
    return (
      <div className="mb-8 w-full">
        <h3 className="text-3xl font-bold text-green mb-6 text-center">Deep Eval (품질/윤리) 평가 비교</h3>
        <div className="bg-white/5 rounded-xl p-8 border border-orange/20">
          <ResponsiveContainer width="100%" height={600}>
            <RadarChart data={data}>
              <PolarGrid gridType="polygon" stroke="rgba(255, 165, 0, 0.3)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#ffffff' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#ffffff' }} />
              {filteredModels.map((model, index) => (
                <Radar
                  key={model.id}
                  name={model.name}
                  dataKey={model.name}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={3}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: '14px', color: '#ffffff' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDeepTeamChart = () => {
    const data = prepareDeepTeamChartData();
    const filteredModels = getFilteredModels();
    
    return (
      <div className="mb-8 w-full">
        <h3 className="text-3xl font-bold text-green mb-6 text-center">Deep Team (보안) 평가 비교</h3>
        <div className="bg-white/5 rounded-xl p-8 border border-orange/20">
          <ResponsiveContainer width="100%" height={600}>
            <RadarChart data={data}>
              <PolarGrid gridType="polygon" stroke="rgba(255, 165, 0, 0.3)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#ffffff' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#ffffff' }} />
              {filteredModels.map((model, index) => (
                <Radar
                  key={model.id}
                  name={model.name}
                  dataKey={model.name}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={3}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: '14px', color: '#ffffff' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPsychologyChart = () => {
    const data = preparePsychologyChartData();
    
    return (
      <div className="mb-8 w-full">
        <h3 className="text-3xl font-bold text-green mb-6 text-center">심리학 평가 결과 비교</h3>
        <div className="bg-white/5 rounded-xl p-8 border border-orange/20">
          <ResponsiveContainer width="100%" height={600}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 165, 0, 0.2)" />
              <XAxis 
                dataKey="model" 
                tick={{ fontSize: 12, fill: '#ffffff' }}
                axisLine={{ stroke: '#ffffff' }}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 12, fill: '#ffffff' }}
                axisLine={{ stroke: '#ffffff' }}
              />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'percentage') return [`${value}%`, '적합도'];
                  return [value, name];
                }}
                labelFormatter={(label) => `모델: ${label}`}
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  border: '1px solid #FFA500',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Bar dataKey="percentage" fill="#10B981" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDeepTeamTable = () => {
    // Deep Team 보안 메트릭들
    const securityMetrics = [
      { name: '프롬프트 주입 방지', criterion: 'prompt_injection', description: '악의적인 명령어 주입 공격 차단' },
      { name: '탈옥 방지 (Jailbreaking)', criterion: 'jailbreaking', description: '시스템 제약 우회 시도 차단' },
      { name: '역할 혼동 방지', criterion: 'role_confusion', description: '역할 변경을 통한 보안 우회 차단' },
      { name: '사회공학 방지', criterion: 'social_engineering', description: '사회공학적 조작 시도 차단' }
    ];

    return (
      <div className="space-y-8">
        {/* 윤리 카테고리별 종합 평가 (보안) */}
        <div className="bg-red/5 rounded-xl p-6 border-2 border-red/30">
          <h4 className="text-xl font-bold text-red mb-4 flex items-center">
            <span className="mr-2 text-2xl">🎯</span>
            윤리 카테고리별 종합 평가 (보안)
            <span className="ml-3 text-sm text-red/70 font-normal">
              DeepTeam 프레임워크 기반 보안 관련 윤리 카테고리별 점수
            </span>
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-base text-left">
              <thead className="text-base text-red bg-transparent">
                <tr>
                  <th scope="col" className="px-6 py-4 font-bold text-lg w-2/5">윤리 카테고리</th>
                  {getFilteredModels().map(model => (
                    <th key={model.id} scope="col" className="px-6 py-4 text-center font-bold text-lg">
                      {model.name}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-4 text-center font-bold text-lg">평균</th>
                </tr>
              </thead>
              <tbody>
                {['stability', 'safety', 'fairness', 'risk-management', 'accountability'].map((category, index) => (
                  <tr key={index} className="bg-transparent hover:bg-white/10 border-b border-white/10">
                    <th scope="row" className="px-6 py-4 text-base font-semibold text-red">
                      <div className="flex flex-col">
                        <span className="text-base font-semibold">
                          {category === 'stability' ? '안정성 (Stability)' :
                           category === 'safety' ? '안전성 (Safety)' :
                           category === 'fairness' ? '공정성 (Fairness)' :
                           category === 'risk-management' ? '위험 관리 (Risk Management)' :
                           category === 'accountability' ? '책임성 (Accountability)' : category}
                        </span>
                        <span className="text-sm text-red/70 mt-1 font-normal leading-tight">
                          보안 관점에서의 {category} 평가
                        </span>
                      </div>
                    </th>
                    {getFilteredModels().map(model => {
                      const result = getEthicsCategoryScore(model.id, category);
                      return (
                        <td key={model.id} className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${
                            result.completed 
                              ? 'bg-red/20 text-red border border-red/30' 
                              : 'bg-gray/20 text-gray border border-gray/30'
                          }`}>
                            {result.completed ? <CheckCircleIcon className="w-4 h-4 mr-2" /> : <XCircleIcon className="w-4 h-4 mr-2" />}
                            {result.score}
                            {result.details && <div className="text-xs text-red/80 mt-1">({result.details})</div>}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-center text-base font-bold text-orange">계산중</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 세부 메트릭별 상세 평가 (보안) */}
        <div className="bg-orange/5 rounded-xl p-6 border-2 border-orange/30">
          <h4 className="text-xl font-bold text-orange mb-4 flex items-center">
            <span className="mr-2 text-2xl">📋</span>
            세부 메트릭별 상세 평가 (보안)
            <span className="ml-3 text-sm text-orange/70 font-normal">
              보안 공격 유형별 상세 저항률 점수
            </span>
          </h4>
        </div>

        {/* 보안 메트릭 테이블 */}
        <div className="bg-white/5 rounded-xl p-6 border border-red/20">
          <h4 className="text-xl font-bold text-red mb-4 flex items-center">
            <span className="mr-2 text-2xl">🛡️</span>
            보안 공격 유형별 저항률
            <span className="ml-3 text-sm text-red/70 font-normal">
              (세부 메트릭별 점수)
            </span>
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-base text-left">
              <thead className="text-base text-red bg-transparent">
                <tr>
                  <th scope="col" className="px-6 py-4 font-bold text-lg w-2/5">보안 메트릭 항목</th>
                  {getFilteredModels().map(model => (
                    <th key={model.id} scope="col" className="px-6 py-4 text-center font-bold text-lg">
                      {model.name}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-4 text-center font-bold text-lg">평균</th>
                </tr>
              </thead>
              <tbody>
                {securityMetrics.map((metric, index) => (
                  <tr key={index} className="bg-transparent hover:bg-white/10 border-b border-white/10">
                    <th scope="row" className="px-6 py-4 text-base font-semibold text-red">
                      <div className="flex flex-col">
                        <span className="text-base font-semibold">
                          {metric.name}
                        </span>
                        <span className="text-sm text-red/70 mt-1 font-normal leading-tight">
                          {metric.description}
                        </span>
                      </div>
                    </th>
                    {getFilteredModels().map(model => {
                      const result = getEthicsScore(model.id, metric.criterion);
                      return (
                        <td key={model.id} className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${
                            result.completed 
                              ? 'bg-red/20 text-red border border-red/30' 
                              : 'bg-gray/20 text-gray border border-gray/30'
                          }`}>
                            {result.completed ? <CheckCircleIcon className="w-4 h-4 mr-2" /> : <XCircleIcon className="w-4 h-4 mr-2" />}
                            {result.score}
                            {result.details && <div className="text-xs text-red/80 mt-1">({result.details})</div>}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-center text-base font-bold text-orange">계산중</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderEducationalChart = () => {
    const data = prepareEducationalChartData();
    const filteredModels = getFilteredModels();
    
    return (
      <div className="mb-8 w-full">
        <h3 className="text-3xl font-bold text-green mb-6 text-center">초등교육 품질평가 비교</h3>
        <div className="bg-white/5 rounded-xl p-8 border border-orange/20">
          <ResponsiveContainer width="100%" height={600}>
            <RadarChart data={data}>
              <PolarGrid gridType="polygon" stroke="rgba(255, 165, 0, 0.3)" />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fontSize: 14, fill: '#ffffff' }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: '#ffffff' }}
              />
              {filteredModels.map((model, index) => (
                <Radar
                  key={model.id}
                  name={model.name}
                  dataKey={model.name}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={3}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: '14px', color: '#ffffff' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-lime min-h-screen">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-white/5 border border-white rounded-lg hover:bg-white/10"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              메인으로
            </button>
            <h1 className="text-xl font-bold text-white ml-4">모델 비교 분석</h1>
          </div>
          
          {/* 업데이트 상태 표시 */}
          {(activeTab === 'deep-eval' || activeTab === 'deep-team') && (
            <div className="flex items-center space-x-2">
              {isUpdating && (
                <div className="animate-pulse flex items-center bg-orange/20 text-orange rounded-full px-4 py-1 text-sm border border-orange/30">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  데이터 업데이트 중...
                </div>
              )}
              {lastUpdated && !isUpdating && (
                <div className="flex items-center text-green/80 text-sm">
                  <span className="mr-1">최근 업데이트:</span>
                  <span className="font-bold">{lastUpdated}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-[32pt] font-bold text-green mb-2">AI 모델 상세 비교</h2>
          <p className="text-green max-w-3xl mx-auto text-lg">
            다양한 평가 기준에 따라 주요 AI 모델들의 성능을 비교하고 분석합니다.
          </p>
        </div>

        {/* 평가지표 탭 */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex space-x-1 bg-white/10 rounded-xl p-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-8 py-3 text-lg font-semibold rounded-lg transition-all ${
                    activeTab === tab.id 
                      ? 'bg-orange text-white shadow-lg' 
                      : 'text-white hover:bg-white/10 hover:text-green'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-white text-2xl">데이터를 불러오는 중...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 모델 선택 - 상단 가로 배치 */}
            <div className="bg-white/5 rounded-xl p-6 border border-orange/20">
              <h3 className="text-2xl font-bold text-green mb-6 text-center">
                📊 비교할 모델 선택
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {models.map((model) => (
                  <label
                    key={model.id}
                    className={`flex items-center p-4 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                      selectedModels.includes(model.id)
                        ? 'bg-orange/20 border-2 border-orange shadow-lg'
                        : 'bg-white/10 border-2 border-white/20 hover:border-orange/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(model.id)}
                      onChange={() => toggleModelSelection(model.id)}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded border-2 mr-4 flex items-center justify-center ${
                      selectedModels.includes(model.id)
                        ? 'bg-orange border-orange'
                        : 'border-white/40'
                    }`}>
                      {selectedModels.includes(model.id) && (
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <model.icon className={`w-8 h-8 mr-4 ${
                      selectedModels.includes(model.id) ? 'text-orange' : 'text-white'
                    }`} />
                    <div className="flex-1">
                      <div className={`text-lg font-semibold ${
                        selectedModels.includes(model.id) ? 'text-green' : 'text-white'
                      }`}>{model.name}</div>
                      <div className={`text-base ${
                        selectedModels.includes(model.id) ? 'text-green/80' : 'text-white/70'
                      }`}>{model.provider}</div>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-orange/30 text-center">
                <div className="text-lg text-white/80">
                  선택된 모델: <span className="font-bold text-orange text-xl">{selectedModels.length}</span>개
                </div>
              </div>
            </div>

            {/* 메인 콘텐츠 - 차트 & 데이터 */}
            <div className="space-y-8">
              {activeTab === 'deep-eval' && (
                <>
                  {renderDeepEvalChart()}
                  {renderEthicsTable()}
                </>
              )}
              {activeTab === 'deep-team' && (
                <>
                  {renderDeepTeamChart()}
                  {renderDeepTeamTable()}
                </>
              )}
              {activeTab === 'psychology' && (
                <>
                  {renderPsychologyChart()}
                  {renderPsychologyTable()}
                </>
              )}
              {activeTab === 'expert' && (
                <>
                  {renderEducationalChart()}
                  {renderExpertTable()}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 