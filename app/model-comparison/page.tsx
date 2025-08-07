'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ChartBarIcon, ServerIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/contexts/AuthContext';
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
  const [deepMetricsResults, setDeepMetricsResults] = useState<any>(null);
  const [models, setModels] = useState<ModelType[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모델 목록 가져오기
  useEffect(() => {
    const fetchModels = async () => {
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
        } else {
          console.error('Failed to fetch models');
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        // 모델 목록을 불러온 후 로딩 상태 해제
        setIsLoading(false);
      }
    };
    fetchModels();
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
                  totalQuestions: 5, // 5개 평가 영역
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

  // 심리학 탭이 활성화될 때 결과 새로고침
  useEffect(() => {
    if (activeTab === 'psychology' && user && models.length > 0) {
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

      refreshPsychologicalResults();
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
    const fetchDeepMetricsResults = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/evaluation-results');
        if (response.ok) {
          const data = await response.json();
          setDeepMetricsResults(data);
        }
      } catch (error) {
        console.error('Error fetching deep metrics evaluations:', error);
      }
    };

    fetchDeepMetricsResults();
  }, [user]);

  const tabs = [
    { id: 'ethics', name: '윤리 평가' },
    { id: 'psychology', name: '심리학 평가' },
    { id: 'deep-metrics', name: 'Deep 메트릭 평가' },
          { id: 'expert', name: '초등교육 품질평가' },
  ];

  const getEthicsScore = (modelId: string, criterion: string) => {
    if (!ethicsResults[modelId] || !ethicsResults[modelId][criterion]) {
      return { score: '미평가', completed: false };
    }
    
    const result = ethicsResults[modelId][criterion];
    return { 
      score: `${result.score}점`, 
      completed: result.completed 
    };
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

  const getDeepMetricsScore = (modelName: string, metricName: string) => {
    if (!deepMetricsResults || !deepMetricsResults.results || !deepMetricsResults.results[modelName]) {
      return { score: '미평가', completed: false };
    }
    
    const modelResults = deepMetricsResults.results[modelName];
    
    // 메트릭 이름을 영어로 매핑
    const metricMapping: { [key: string]: string } = {
      '충실성 (Faithfulness)': 'faithfulness',
      '답변 관련성 (Answer Relevancy)': 'answer_relevancy',
      '문맥 회상 (Contextual Recall)': 'contextual_recall',
      '문맥 정밀도 (Contextual Precision)': 'contextual_precision',
      '편향성 (Bias)': 'bias',
      '악의성 (Maliciousness)': 'maliciousness',
      '정확성 (Correctness)': 'correctness',
      '일관성 (Coherence)': 'coherence',
      '유해성 (Toxicity)': 'toxicity',
      '자세함 (Verbosity)': 'verbosity',
      '용기 (Courage)': 'courage',
      '그룹 편향 (Group Fairness)': 'group_fairness'
    };
    
    const englishMetric = metricMapping[metricName];
    if (englishMetric && modelResults[englishMetric]) {
      const metricData = modelResults[englishMetric];
      if (metricData.examples && metricData.examples.length > 0) {
        // 평균 점수 계산
        const scores = metricData.examples.map((ex: any) => ex.score).filter((s: any) => s !== null);
        if (scores.length > 0) {
          const avgScore = (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(2);
          return { 
            score: `${avgScore}점`, 
            completed: true,
            details: `${scores.length}개 테스트`
          };
        }
      }
    }
    
    return { score: '미평가', completed: false };
  };

  const evaluationMetrics = {
    ethics: [
      { name: '책임성 (Accountability)', criterion: 'accountability' },
      { name: '데이터/개인정보보호', criterion: 'data-privacy' },
      { name: '공정성 (Fairness)', criterion: 'fairness' },
      { name: '포용성 (Inclusion)', criterion: 'inclusion' },
      { name: '투명성 (Transparency)', criterion: 'transparency' },
      { name: '피해 방지 (Harm Prevention)', criterion: 'harm-prevention' },
      { name: '안전성 (Safety)', criterion: 'safety' },
      { name: '유지 보수 (Maintenance)', criterion: 'maintenance' },
      { name: '위험 관리 (Risk Management)', criterion: 'risk-management' },
      { name: '안정성 (Stability)', criterion: 'stability' },
    ],
    psychology: [
      { name: '발달심리학 - 피아제 인지발달이론' },
      { name: '발달심리학 - 비고츠키 사회문화이론' },
      { name: '사회심리학 - 사회적 정체성 이론' },
      { name: '사회심리학 - 사회학습 이론' },
      { name: '인지심리학 - 정보처리 이론' },
      { name: '인지심리학 - 인지부하 이론' },
    ],
    deepMetricsDeepEval: [
      { name: '충실성 (Faithfulness)', category: 'RAG 메트릭' },
      { name: '답변 관련성 (Answer Relevancy)', category: 'RAG 메트릭' },
      { name: '문맥 회상 (Contextual Recall)', category: 'RAG 메트릭' },
      { name: '문맥 정밀도 (Contextual Precision)', category: 'RAG 메트릭' },
      { name: '편향성 (Bias)', category: '안전성 메트릭' },
      { name: '악의성 (Maliciousness)', category: '안전성 메트릭' },
      { name: '정확성 (Correctness)', category: '품질 메트릭' },
      { name: '일관성 (Coherence)', category: '품질 메트릭' },
      { name: '유해성 (Toxicity)', category: '안전성 메트릭' },
      { name: '자세함 (Verbosity)', category: '대화형 메트릭' },
      { name: '용기 (Courage)', category: '대화형 메트릭' },
      { name: '그룹 편향 (Group Fairness)', category: '편향 메트릭' }
    ],
    expert: [
      { name: '사실성 평가', description: '모델 출력의 사실 정확성 및 환각(Hallucination) 탐지', metric: 'factuality' },
      { name: '정확성 평가', description: '교과 내용과의 일치성 및 오류 없는 정보 제공 평가', metric: 'accuracy' },
      { name: '구체성 평가', description: '교육 목표 충족도 및 학년별 적합성 평가', metric: 'specificity' },
      { name: '교육적 적합성', description: '초등 교육 도메인에 특화된 품질 평가', metric: 'total' },
      { name: '레드팀 평가', description: '적대적 시나리오를 통한 시스템 취약점 분석', metric: 'total' },
      { name: '규제 준수성 검토', description: '관련 법규 및 가이드라인 준수 여부 확인', metric: 'total' },
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

  const renderEthicsTable = () => (
    <div className="overflow-x-auto bg-transparent rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="text-sm text-green bg-transparent">
          <tr>
            <th scope="col" className="px-6 py-4 font-bold">평가 항목</th>
            {getFilteredModels().map(model => (
              <th key={model.id} scope="col" className="px-6 py-4 text-center font-bold">
                {model.name}
              </th>
            ))}
            <th scope="col" className="px-6 py-4 text-center font-bold">평균</th>
          </tr>
        </thead>
        <tbody>
          {evaluationMetrics.ethics.map((metric, index) => (
            <tr key={index} className="bg-transparent hover:bg-gray-100/10">
              <th scope="row" className="px-6 py-4 text-sm font-medium text-green whitespace-nowrap">
                {metric.name}
              </th>
              {getFilteredModels().map(model => {
                const result = getEthicsScore(model.id, metric.criterion);
                return (
                  <td key={model.id} className="px-6 py-4 text-center text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      result.completed 
                        ? 'bg-white/20 text-green border border-white/30' 
                        : 'bg-white/10 text-green/70 border border-white/20'
                    }`}>
                      {result.completed ? <CheckCircleIcon className="w-3 h-3 mr-1" /> : <XCircleIcon className="w-3 h-3 mr-1" />}
                      {result.score}
                    </span>
                  </td>
                );
              })}
              <td className="px-6 py-4 text-center text-sm font-bold text-green">평균</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPsychologyTable = () => {
    const areaNames = {
      step_by_step_teaching: '단계적 설명력',
      collaborative_learning: '협력학습 지도',
      confidence_building: '자신감 키우기',
      individual_recognition: '개성 인정',
      clear_communication: '명확한 소통'
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
      <div className="space-y-6">
        {/* 종합 평가 */}
        <div className="overflow-x-auto bg-transparent rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">📊 아동교육 적합성 종합 평가</h3>
          <p className="text-sm text-green-600 mb-4">
            각 모델의 전체적인 아동교육 적합성을 종합적으로 평가한 결과입니다. 
            5개 평가 영역의 평균 점수를 기반으로 등급과 사용자 친화적 요약을 제공합니다.
          </p>
          <table className="w-full text-sm text-left">
            <thead className="text-sm text-green bg-transparent">
              <tr>
                <th scope="col" className="px-6 py-4 font-bold">모델명</th>
                <th scope="col" className="px-6 py-4 text-center font-bold">종합 점수</th>
                <th scope="col" className="px-6 py-4 text-center font-bold">적합도</th>
                <th scope="col" className="px-6 py-4 text-center font-bold">등급</th>
                <th scope="col" className="px-6 py-4 text-center font-bold">평가 요약</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredModels().map(model => {
                const result = psychologicalResults[model.id];
                return (
                  <tr key={model.id} className="bg-transparent hover:bg-gray-100/10 border-b border-gray-200">
                    <th scope="row" className="px-6 py-4 text-sm font-medium text-green whitespace-nowrap">{model.name}</th>
                    <td className="px-6 py-4 text-center text-sm">
                      {result ? (
                        <span className="font-semibold text-green">{result.totalScore.toFixed(2)}/5.0</span>
                      ) : (
                        <span className="text-green/70">미평가</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {result ? (
                        <span className="font-semibold text-green">{result.percentage.toFixed(1)}%</span>
                      ) : (
                        <span className="text-green/70">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {result ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          result.grade === 'A+' || result.grade === 'A' ? 'bg-green-100 text-green-600' :
                          result.grade === 'B+' || result.grade === 'B' ? 'bg-blue-100 text-blue-600' :
                          result.grade === 'C' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {result.grade}
                        </span>
                      ) : (
                        <span className="text-green/70">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs">
                      {result?.user_friendly_summary ? (
                        <div className="text-gray-600 text-xs overflow-hidden" style={{ maxHeight: '3em' }}>
                          {result.user_friendly_summary.slice(0, 100)}...
                        </div>
                      ) : (
                        <span className="text-green/70">평가 필요</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 영역별 상세 평가 */}
        <div className="overflow-x-auto bg-transparent rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">🎯 영역별 상세 평가</h3>
          <p className="text-sm text-green-600 mb-4">
            아동교육의 핵심 5개 영역별로 각 모델의 성능을 세분화하여 평가한 결과입니다. 
            각 영역은 0~5점 척도로 평가되며, 위 종합평가의 기초 데이터가 됩니다.
          </p>
          <table className="w-full text-sm text-left">
            <thead className="text-sm text-green bg-transparent">
              <tr>
                <th scope="col" className="px-6 py-4 font-bold">평가 영역</th>
                {getFilteredModels().map(model => <th key={model.id} scope="col" className="px-6 py-4 text-center font-bold">{model.name}</th>)}
                <th scope="col" className="px-6 py-4 text-center font-bold">평균</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(areaNames).map(([areaKey, areaName]) => (
                <tr key={areaKey} className="bg-transparent hover:bg-gray-100/10 border-b border-gray-200">
                  <th scope="row" className="px-6 py-4 text-sm font-medium text-green whitespace-nowrap">{areaName}</th>
                  {getFilteredModels().map(model => {
                    const result = psychologicalResults[model.id];
                    const score = result?.area_scores?.[areaKey as keyof typeof areaNames];
                    return (
                      <td key={model.id} className="px-6 py-4 text-center text-sm">
                        {score !== undefined ? (
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-green">{score.toFixed(2)}</span>
                            <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                              <div 
                                className="bg-green-600 h-1 rounded-full" 
                                style={{ width: `${(score / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-green/70">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center text-sm font-bold text-green">
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

  const renderDeepMetricsTable = () => (
    <div className="overflow-x-auto bg-transparent rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="text-sm text-green bg-transparent">
          <tr>
            <th scope="col" className="px-6 py-4 font-bold">평가 항목</th>
            <th scope="col" className="px-6 py-4 font-bold">카테고리</th>
            {getFilteredModels().map(model => <th key={model.id} scope="col" className="px-6 py-4 text-center font-bold">{model.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {evaluationMetrics.deepMetricsDeepEval.map((metric, index) => (
            <tr key={index} className="bg-transparent hover:bg-gray-100/10">
              <th scope="row" className="px-6 py-4 text-sm font-medium text-green whitespace-nowrap">{metric.name}</th>
              <td className="px-6 py-4 text-sm">
                <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-md border border-white/30">
                  {metric.category}
                </span>
              </td>
              {getFilteredModels().map(model => {
                const score = getDeepMetricsScore(model.name, metric.name);
                return (
                  <td key={model.id} className="px-6 py-4 text-center text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      score.completed 
                        ? 'bg-white/20 text-green border border-white/30' 
                        : 'bg-white/10 text-green/70 border border-white/20'
                    }`}>
                      {score.completed ? <CheckCircleIcon className="w-3 h-3 mr-1" /> : <XCircleIcon className="w-3 h-3 mr-1" />}
                      {score.score}
                      {score.details && <span className="text-xs text-green/80 ml-1">({score.details})</span>}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderExpertTable = () => (
    <div className="overflow-x-auto bg-transparent rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="text-sm text-green bg-transparent">
          <tr>
            <th scope="col" className="px-6 py-4 font-bold">평가 항목</th>
            <th scope="col" className="px-6 py-4 font-bold">설명</th>
            {getFilteredModels().map(model => <th key={model.id} scope="col" className="px-6 py-4 text-center font-bold">{model.name}</th>)}
            <th scope="col" className="px-6 py-4 text-center font-bold">평균</th>
          </tr>
        </thead>
        <tbody>
          {evaluationMetrics.expert.map((metric, index) => (
            <tr key={index} className="bg-transparent hover:bg-gray-100/10">
              <th scope="row" className="px-6 py-4 text-sm font-medium text-green whitespace-nowrap">{metric.name}</th>
              <td className="px-6 py-4 text-sm text-green/80 max-w-xs">{metric.description}</td>
              {getFilteredModels().map(model => {
                const score = getEducationalScore(model.id, metric.metric);
                return (
                  <td key={model.id} className="px-6 py-4 text-center text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      score.completed 
                        ? 'bg-white/20 text-green border border-white/30' 
                        : 'bg-white/10 text-green/70 border border-white/20'
                    }`}>
                      {score.completed ? <CheckCircleIcon className="w-3 h-3 mr-1" /> : <XCircleIcon className="w-3 h-3 mr-1" />}
                      {score.score}
                      {score.details && <span className="text-xs text-white/80 ml-1">({score.details})</span>}
                    </span>
                  </td>
                );
              })}
              <td className="px-6 py-4 text-center text-sm font-bold text-green">평균</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const prepareEthicsChartData = () => {
    const chartData = evaluationMetrics.ethics.map(metric => {
      const dataPoint: any = { 
        metric: metric.name.replace(/\s*\([^)]*\)/g, ''),
        fullMetric: metric.name
      };
      
      getFilteredModels().forEach(model => {
        const result = getEthicsScore(model.id, metric.criterion);
        // 점수에서 숫자만 추출
        const scoreMatch = result.score.match(/(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        dataPoint[model.name] = result.completed ? score : 0;
      });
      
      return dataPoint;
    });
    
    return chartData;
  };

  const preparePsychologyChartData = () => {
    const filteredModels = getFilteredModels();
    const chartData = filteredModels.map(model => {
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

  const prepareDeepMetricsChartData = () => {
    const categories = ['RAG 메트릭', '안전성 메트릭', '품질 메트릭', '대화형 메트릭', '편향 메트릭'];
    const chartData = categories.map(category => {
      const dataPoint: any = { category };
      
      getFilteredModels().forEach(model => {
        const categoryMetrics = evaluationMetrics.deepMetricsDeepEval.filter(m => m.category === category);
        const scores = categoryMetrics.map(metric => {
          const score = getDeepMetricsScore(model.name, metric.name);
          if (score.completed) {
            const scoreMatch = score.score.match(/(\d+\.?\d*)/);
            return scoreMatch ? parseFloat(scoreMatch[1]) : 0;
          }
          return 0;
        });
        
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        dataPoint[model.name] = parseFloat(avgScore.toFixed(2));
      });
      
      return dataPoint;
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
        const score = getEducationalScore(model.id, metric);
        if (score.completed) {
          const scoreMatch = score.score.match(/(\d+)/);
          dataPoint[model.name] = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        } else {
          dataPoint[model.name] = 0;
        }
      });
      
      return dataPoint;
    });
    
    return chartData;
  };

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

  const renderEthicsChart = () => {
    const data = prepareEthicsChartData();
    const filteredModels = getFilteredModels();
    
    return (
      <div className="mb-8">
        <h3 className="text-[20pt] font-semibold text-green mb-4 text-center">윤리 평가 종합 비교</h3>
                        <div className="bg-transparent rounded-lg p-10">
          <ResponsiveContainer width="100%" height={600}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              {filteredModels.map((model, index) => (
                <Radar
                  key={model.id}
                  name={model.name}
                  dataKey={model.name}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPsychologyChart = () => {
    const data = preparePsychologyChartData();
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-green mb-4 text-center">심리학 평가 결과 비교</h3>
                        <div className="bg-transparent rounded-lg p-10">
          <ResponsiveContainer width="100%" height={600}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'percentage') return [`${value}%`, '적합도'];
                  return [value, name];
                }}
                labelFormatter={(label) => `모델: ${label}`}
              />
              <Bar dataKey="percentage" fill="#10B981" radius={[4, 4, 0, 0]}>
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

  const renderDeepMetricsChart = () => {
    const data = prepareDeepMetricsChartData();
    const filteredModels = getFilteredModels();
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-green mb-4 text-center">Deep 메트릭 평가 카테고리별 성과</h3>
                        <div className="bg-transparent rounded-lg p-10">
          <ResponsiveContainer width="100%" height={600}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis domain={[0, 1]} />
              <Tooltip 
                formatter={(value: any) => [value?.toFixed(2), '평균 점수']}
              />
              <Legend />
              {filteredModels.map((model, index) => (
                <Bar
                  key={model.id}
                  dataKey={model.name}
                  fill={COLORS[index % COLORS.length]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderEducationalChart = () => {
    const data = prepareEducationalChartData();
    const filteredModels = getFilteredModels();
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-green mb-4 text-center">초등교육 품질평가 메트릭 비교</h3>
                        <div className="bg-transparent rounded-lg p-10">
          <ResponsiveContainer width="100%" height={600}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              {filteredModels.map((model, index) => (
                <Radar
                  key={model.id}
                  name={model.name}
                  dataKey={model.name}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-lime min-h-screen">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-white/5 border border-white rounded-lg hover:bg-white/10"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            메인으로
          </button>
          <h1 className="text-xl font-bold text-white ml-4">모델 비교 분석</h1>
        </div>
      </div>

      <main className="py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-[32pt] font-bold text-green mb-2">AI 모델 상세 비교</h2>
          <p className="text-green max-w-3xl mx-auto">
            다양한 평가 기준에 따라 주요 AI 모델들의 성능을 비교하고 분석합니다.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-white">데이터를 불러오는 중...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {models.map((model) => (
                <div 
                  key={model.id} 
                  onClick={() => toggleModelSelection(model.id)}
                  className={`p-6 rounded-xl shadow-lg border cursor-pointer transition-all hover:shadow-xl ${
                    selectedModels.includes(model.id)
                      ? 'bg-transparent border-orange border-4 shadow-green/30'
                      : 'bg-transparent border-grey/30 hover:border-orange/50 border-4'
                  }`}
                >
                  <div className="flex items-center">
                    <model.icon className={`w-8 h-8 mr-4 ${
                      selectedModels.includes(model.id) ? 'text-green' : 'text-white'
                    }`} />
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        selectedModels.includes(model.id) ? 'text-green' : 'text-white'
                      }`}>{model.name}</h3>
                      <p className={`text-sm ${
                        selectedModels.includes(model.id) ? 'text-green' : 'text-white'
                      }`}>{model.provider}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-medium">
                    {selectedModels.includes(model.id) ? '선택됨' : '클릭하여 선택'}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <div className="flex justify-center">
                <div className="flex space-x-1 rounded-lg p-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={ ` px-10 py-2.5 text-sm font-semibold rounded-lg transition-colors 
                        ${activeTab === tab.id ? 'bg-transparent border-orange border-4 text-green shadow' : 'text-white'}`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              {activeTab === 'ethics' && (
                <>
                  {renderEthicsChart()}
                  {renderEthicsTable()}
                </>
              )}
              {activeTab === 'psychology' && (
                <>
                  {renderPsychologyChart()}
                  {renderPsychologyTable()}
                </>
              )}
              {activeTab === 'deep-metrics' && (
                <>
                  {renderDeepMetricsChart()}
                  {renderDeepMetricsTable()}
                </>
              )}
              {activeTab === 'expert' && (
                <>
                  {renderEducationalChart()}
                  {renderExpertTable()}
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
} 