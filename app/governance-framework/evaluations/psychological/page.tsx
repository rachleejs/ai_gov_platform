'use client';

import { ArrowLeftIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useActiveModels } from '@/lib/hooks/useActiveModels';
import { useState, useEffect } from 'react';

// 평가 결과 interface
interface EvaluationResult {
  model: string;
  overall_score: number;
  percentage: number;
  grade: string;
  area_scores: {
    step_by_step_teaching: number;
    collaborative_learning: number;
    confidence_building: number;
    individual_recognition: number;
    clear_communication: number;
  };
  details: string;
  user_friendly_summary: string;
  evaluation_data?: {
    scenarios: Array<{
      id: string;
      question: string;
      target_age: number;
      model_response: string;
      area_analysis: any;
    }>;
  };
  timestamp: string;
}

// 평가 상태 interface
interface EvaluationState {
  isRunning: boolean;
  currentModel: string;
  progress: number;
  results: EvaluationResult[];
  error: string | null;
}

// 평가 결과 카드 컴포넌트
function EvaluationResultCard({ result, onClick }: { result: EvaluationResult; onClick?: () => void }) {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': case 'A': return 'text-green-600 bg-green-100 border-green-300';
      case 'B+': case 'B': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'C': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'D': return 'text-orange-600 bg-orange-100 border-orange-300';
      default: return 'text-red-600 bg-red-100 border-red-300';
    }
  };

  // 사용자 친화적 영역명 매핑
  const areaNames = {
    step_by_step_teaching: '단계적 설명력',
    collaborative_learning: '협력학습 지도',
    confidence_building: '자신감 키우기',
    individual_recognition: '개성 인정',
    clear_communication: '명확한 소통'
  };

  return (
    <div 
      className={`bg-transparent rounded-xl shadow-md border-2 border-lime p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{result.model}</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getGradeColor(result.grade)}`}>
          {result.grade}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{result.overall_score.toFixed(2)}</div>
          <div className="text-xs text-gray-500">종합 점수</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{result.percentage.toFixed(1)}%</div>
          <div className="text-xs text-gray-500">아동교육 적합도</div>
        </div>
      </div>
      
      {/* 사용자 친화적 요약 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs font-medium text-gray-700 mb-2">평가 요약</div>
        <div className="text-xs text-gray-600 whitespace-pre-line">
          {result.user_friendly_summary || result.details}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-xs text-[12pt] text-gray-600 font-medium">영역별 점수:</div>
        {Object.entries(result.area_scores).map(([area, score]) => (
          <div key={area} className="flex justify-between text-xs">
            <span className="text-[12pt] text-gray-600">{areaNames[area as keyof typeof areaNames]}</span>
            <span className="font-medium">{score.toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      {onClick && (
        <div className="mt-4 text-center">
          <span className="text-xs text-lime hover:text-white">클릭하여 상세 보기 →</span>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        {new Date(result.timestamp).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}

// 상세 보기 모달 컴포넌트
function DetailModal({ result, isOpen, onClose }: { result: EvaluationResult | null; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !result) return null;

  const areaNames = {
    step_by_step_teaching: '단계적 설명력',
    collaborative_learning: '협력학습 지도',
    confidence_building: '자신감 키우기',
    individual_recognition: '개성 인정',
    clear_communication: '명확한 소통'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-lime rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{result.model} 상세 평가 결과</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* 종합 평가 */}
          <div className="mb-6 p-4 bg-transparent rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">종합 평가</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{result.overall_score.toFixed(2)}</div>
                <div className="text-sm text-gray-600">종합 점수</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{result.percentage.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">아동교육 적합도</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{result.grade}</div>
                <div className="text-sm text-gray-600">등급</div>
              </div>
            </div>
            <div className="text-gray-700 whitespace-pre-line">
              {result.user_friendly_summary}
            </div>
          </div>

          {/* 영역별 상세 분석 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">영역별 분석</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.area_scores).map(([area, score]) => (
                <div key={area} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800">{areaNames[area as keyof typeof areaNames]}</h4>
                    <span className="text-lg font-bold text-green-600">{score.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-transparent h-2 rounded-full" 
                      style={{ width: `${(score / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 시나리오별 응답 상세 */}
          {result.evaluation_data?.scenarios && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">질문별 AI 응답 분석</h3>
              <div className="space-y-4">
                {result.evaluation_data.scenarios.map((scenario, index) => (
                  <div key={scenario.id} className="border rounded-lg p-4">
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-800 mb-1">
                        질문 {index + 1} (대상: {scenario.target_age}세)
                      </h4>
                      <p className="text-gray-600 bg-transparent p-3 rounded">{scenario.question}</p>
                    </div>
                    <div className="mb-3">
                      <h5 className="font-medium text-gray-800 mb-1">AI 응답:</h5>
                      <p className="text-gray-700 bg-transparent p-3 rounded">{scenario.model_response}</p>
                    </div>
                    {scenario.area_analysis && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(scenario.area_analysis).map(([area, analysis]: [string, any]) => (
                          <div key={area} className="p-3 bg-transparent rounded">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{areaNames[area as keyof typeof areaNames]}</span>
                              <span className="text-sm font-bold">{analysis.score?.toFixed(1)}</span>
                            </div>
                            <p className="text-xs text-gray-600">{analysis.explanation}</p>
                            {analysis.found_keywords?.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">발견된 키워드: </span>
                                <span className="text-xs text-green-600">{analysis.found_keywords.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 닫기 버튼 */}
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-green rounded-lg hover:bg-orange"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PsychologicalEvaluation() {
  const router = useRouter();
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [evaluationState, setEvaluationState] = useState<EvaluationState>({
    isRunning: false,
    currentModel: '',
    progress: 0,
    results: [],
    error: null
  });
  const [selectedResult, setSelectedResult] = useState<EvaluationResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 모델 옵션 (DB에서 동적 로드)
  const models = useActiveModels();

  // 이전 평가 결과 로드
  useEffect(() => {
    const fetchPreviousResults = async () => {
      try {
        const response = await fetch('/api/evaluation/psychological');
        if (response.ok) {
          const data = await response.json();
          if (data && data.results) {
            setEvaluationState(prev => ({ ...prev, results: data.results }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch previous results', error);
      }
    };
    fetchPreviousResults();
  }, []);

  // 모델 선택 핸들러
  const handleModelSelection = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        return [...prev, modelId];
      }
    });
  };

  // 평가 실행 함수
  const runEvaluation = async () => {
    if (selectedModels.length === 0) {
      alert('먼저 평가할 모델을 선택해주세요.');
      return;
    }

    setEvaluationState(prev => ({ ...prev, isRunning: true, error: null, progress: 0 }));

    try {
      const totalModels = selectedModels.length;
      const newResults: EvaluationResult[] = [];

      for (let i = 0; i < selectedModels.length; i++) {
        const modelId = selectedModels[i];
        const model = models.find(m => m.id === modelId);
        
        if (!model) continue;

        setEvaluationState(prev => ({ 
          ...prev, 
          currentModel: model.name,
          progress: (i / totalModels) * 100
        }));

        // 시나리오별 진행률을 시뮬레이션하기 위해 추가 업데이트
        const scenarioCount = 30; // 총 30개 시나리오
        let scenarioProgress = 0;

        console.log('🧠 심리학 평가 요청 전송', { modelId, modelName: model.name });
        
        // 시나리오별 진행률 시뮬레이션 (평가는 대략 30-60초 걸림)
        const progressInterval = setInterval(() => {
          scenarioProgress += Math.random() * 5; // 랜덤하게 증가
          if (scenarioProgress > 95) scenarioProgress = 95; // 95%에서 멈춤
          
          setEvaluationState(prev => ({ 
            ...prev, 
            progress: ((i / totalModels) * 100) + (scenarioProgress / totalModels)
          }));
        }, 1000);

        // API 호출로 평가 실행 (타임아웃 설정)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5분 타임아웃
        
        try {
          const response = await fetch('/api/evaluation/psychological', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              modelId: modelId,
              modelName: model.name,
              provider: model.provider
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
        
          // 진행률 업데이트 중지
          clearInterval(progressInterval);

          if (response.ok) {
            const result = await response.json();
            console.log('✅ 심리학 평가 결과 수신', result);
            newResults.push({
              model: model.name,
              overall_score: result.overall_score || 0,
              percentage: result.percentage || 0,
              grade: result.grade || 'F',
              area_scores: result.area_scores || {
                step_by_step_teaching: 0,
                collaborative_learning: 0,
                confidence_building: 0,
                individual_recognition: 0,
                clear_communication: 0
              },
              details: result.details || '',
              user_friendly_summary: result.user_friendly_summary || '평가 완료',
              evaluation_data: result.evaluation_data,
              timestamp: new Date().toISOString()
            });
          } else {
            console.error(`❌ 평가 실패: ${model.name}`, await response.text());
            clearInterval(progressInterval);
            setEvaluationState(prev => ({ 
              ...prev, 
              error: `${model.name} 평가 중 서버 오류가 발생했습니다.`
            }));
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          clearInterval(progressInterval);
          
          if (fetchError.name === 'AbortError') {
            console.error(`⏰ 평가 타임아웃: ${model.name}`);
            setEvaluationState(prev => ({ 
              ...prev, 
              error: `${model.name} 평가가 타임아웃되었습니다. 네트워크를 확인해주세요.`
            }));
          } else {
            console.error(`❌ 네트워크 오류: ${model.name}`, fetchError);
            setEvaluationState(prev => ({ 
              ...prev, 
              error: `${model.name} 평가 중 네트워크 오류가 발생했습니다.`
            }));
          }
          break; // 오류 발생 시 평가 중단
        }
      }

      setEvaluationState(prev => ({ 
        ...prev, 
        isRunning: false, 
        progress: 100,
        results: [...prev.results, ...newResults],
        currentModel: ''
      }));

      if (newResults.length > 0) {
        alert(`${newResults.length}개 모델의 평가가 완료되었습니다.`);
      }

    } catch (error) {
      console.error('Evaluation failed:', error);
      setEvaluationState(prev => ({ 
        ...prev, 
        isRunning: false, 
        error: '평가 중 오류가 발생했습니다.'
      }));
    }
  };

  // 평가 중지 함수
  const stopEvaluation = () => {
    setEvaluationState(prev => ({ 
      ...prev, 
      isRunning: false,
      currentModel: '',
      progress: 0
    }));
  };

  // 간단한 예시 데이터
  const psychologyTheories = [
    {
      name: '피아제 인지발달 이론',
      description: '연령별 인지 발달 단계와 능동적 학습 과정 분석',
      keywords: ['예시', '시각적', '단계적', '체험적']
    },
    {
      name: '비고츠키 사회문화 이론',
      description: '근접발달영역과 사회적 상호작용 통한 학습 분석',
      keywords: ['도움', '협력', '사회적', '언어']
    },
    {
      name: '반두라 사회학습 이론',
      description: '모델링과 관찰학습, 자기효능감 증진 분석',
      keywords: ['모델링', '자신감', '칭찬', '관찰']
    },
    {
      name: '사회정체성 이론',
      description: '긍정적 정체성 형성과 편견 방지 분석',
      keywords: ['다양성', '존중', '소속감', '편견방지']
    },
    {
      name: '정보처리 이론',
      description: '주의집중, 기억, 인지부하 최적화 분석',
      keywords: ['집중', '기억', '인지부하', '정보처리']
    }
  ];

  return (
    <div className="min-h-screen bg-grey text-gray-700">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/governance-framework')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              거버넌스 체계로 돌아가기
            </button>
            <h1 className="text-[24pt] font-bold text-green-800">심리학적 접근 평가</h1>
          </div>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* 평가 실행 컨트롤 섹션 */}
          <div className="bg-transparent p-6 border-2 border-lime rounded-xl shadow-md border border-gray-300 mb-8">
            <div className="px-6 py-6">
              <div className="md:flex md:items-center md:justify-between mb-6">
                <div>
                  <h2 className="text-[20pt] font-semibold text-green-800">심리학적 평가 실행</h2>
                  <p className="mt-1 text-sm text-[12pt] text-gray-600">
                    평가할 AI 모델을 선택하고 심리학적 접근 방식으로 평가를 실행하세요.
                  </p>
                </div>
                <div className="mt-4 flex items-center space-x-3 md:mt-0">
                  {!evaluationState.isRunning ? (
                    <button
                      onClick={runEvaluation}
                      disabled={selectedModels.length === 0}
                      className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500"
                    >
                      <PlayIcon className="w-4 h-4 mr-2" />
                      평가 시작
                    </button>
                  ) : (
                    <button
                      onClick={stopEvaluation}
                      className="inline-flex items-center px-4 py-2 border border-red-500 text-sm font-medium rounded-lg shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <StopIcon className="w-4 h-4 mr-2" />
                      평가 중지
                    </button>
                  )}
                </div>
              </div>

              {/* 모델 선택 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">평가 대상 모델 선택</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className={`cursor-pointer p-4 border-2 rounded-xl transition-all ${
                        selectedModels.includes(model.id)
                          ? 'border-green-500 bg-transparent ring-2 ring-orange'
                          : 'border-gray-300 hover:border-orange'
                      }`}
                      onClick={() => handleModelSelection(model.id)}
                    >
                      <div className="text-lg font-semibold text-gray-800">{model.name}</div>
                      <div className="text-sm text-gray-500">{model.provider}</div>
                      {selectedModels.includes(model.id) && (
                        <div className="mt-2 text-xs font-bold text-orange">✓ 선택됨</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 평가 진행 상태 */}
              {evaluationState.isRunning && (
                <div className="bg-transparent border border-white rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-lime">
                      평가 진행 중: {evaluationState.currentModel}
                      <div className="text-xs text-lime mt-2">
                        30개 시나리오 평가 중... (약 30-60초 소요)
                      </div>
                    </div>
                    <div className="text-sm text-lime">
                      {evaluationState.progress.toFixed(1)}%
                    </div>
                  </div>
                  <div className="w-full bg-transparent rounded-full h-2">
                    <div 
                      className="bg-lime h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${evaluationState.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* 오류 메시지 */}
              {evaluationState.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="text-sm text-red-800">{evaluationState.error}</div>
                </div>
              )}
            </div>
          </div>

          {/* 개요 섹션 */}
          <div className="mt-8 bg-transparent p-6 border-2 border-lime rounded-xl shadow-md border border-gray-300">
            <div className="px-6 py-6">
              <h2 className="text-[20pt] font-semibold text-green-800 mb-4">평가 개요</h2>
              <p className="text-[12pt] text-gray-600 mb-4">
                본 평가 시스템은 아동을 대상으로 하는 AI 서비스가 인간의 인지적, 정서적, 사회적 특성을 얼마나 잘 반영하고 있는지를 평가하기 위한 도구입니다.<br/>
                5개의 심리학 이론을 기반으로 하여 체계적이고 포괄적인 평가를 제공합니다.
              </p>
              <div className="bg-transparent border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">평가 방식</h3>
                <ul className="text-[10pt] text-green-700 space-y-2">
                  <li><span className="font-semibold text-green-800">• 자동 평가 시스템:</span> 심리학 이론에 근거한 자동화된 평가 시스템</li>
                  <li><span className="font-semibold text-green-800">• 실시간 분석:</span> AI 모델의 응답을 실시간으로 분석하고 점수 산출</li>
                  <li><span className="font-semibold text-green-800">• 종합 평가:</span> 정성적, 정량적 데이터를 종합하여 다각도로 분석</li>
                  <li><span className="font-semibold text-green-800">• 5점 척도:</span> 1(전혀 아님)부터 5(매우 그러함)까지 점수 부여</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 심리학 이론 설명 섹션 */}
          <div className="mt-8 bg-transparent p-6 border-2 border-lime rounded-xl shadow-md border border-gray-300">
            <div className="px-6 py-6">
              <h2 className="text-[20pt] font-semibold text-green-800 mb-6">심리학 이론 안내</h2>
              <p className="text-[12pt] text-gray-600 mb-6">
                평가에 사용되는 5가지 주요 심리학 이론을 쉽게 설명해드립니다.
              </p>
              
              <div className="space-y-6">
                {psychologyTheories.map((theory, index) => (
                  <div key={index} className="rounded-lg p-5 bg-transparent border-2 border-lime">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-white bg-opacity-20 text-white text-sm font-bold rounded-full">{index + 1}</span>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-green-800 mb-2">{theory.name}</h3>
                        <div className="text-[10pt] text-green-700 mb-3">
                          <p>{theory.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {theory.keywords.map((keyword, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green text-white text-xs rounded-full">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 평가 결과 */}
          {evaluationState.results.length > 0 && (
            <div className="mt-8 bg-transparent p-6 border-2 border-lime rounded-xl shadow-md border border-gray-300">
              <div className="px-6 py-6">
                <h2 className="text-[20pt] font-semibold text-green-800 mb-6">평가 결과</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {evaluationState.results.map((result, index) => (
                    <EvaluationResultCard 
                      key={index} 
                      result={result} 
                      onClick={() => {
                        setSelectedResult(result);
                        setShowDetailModal(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 상세 보기 모달 */}
      <DetailModal 
        result={selectedResult}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedResult(null);
        }}
      />
    </div>
  );
}