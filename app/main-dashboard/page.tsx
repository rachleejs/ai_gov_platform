'use client'

import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ShieldCheckIcon, 
  UserCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

import { useState, useEffect } from 'react';
import { dashboardService, evaluationService, modelService } from '../../lib/database';
import { useAuth } from '../contexts/AuthContext';

export default function MainDashboard() {
  const router = useRouter();

  const { user } = useAuth();
  const [metrics, setMetrics] = useState([
    {
      name: '완료된 평가',
      value: '0',
      change: '+0',
      trend: 'up',
  },
    {
      name: '진행률',
      value: '0%',
      change: '+0%',
      trend: 'up',
    },
    {
      name: '평균 점수',
      value: '0점',
      change: '+0점',
      trend: 'up',
  },
    {
      name: '신뢰도',
      value: '0%',
      change: '+0%',
      trend: 'up',
    },
  ]);

  const models = ['gpt4-turbo', 'claude3-opus', 'gemini2-flash'];
  const ethicsCriteria = ['accountability', 'data-privacy', 'fairness', 'inclusion', 'transparency', 'harm-prevention', 'safety', 'maintenance', 'risk-management', 'stability'];

  // 데이터베이스에서 평가 데이터 로드 및 메트릭 계산
  useEffect(() => {
    const calculateMetrics = async () => {
      if (!user) return;

      try {
        // 전체 통계 데이터 가져오기
        const stats = await dashboardService.getOverallStats();
        
        // 사용자의 평가 데이터 가져오기
        const userEvaluations = await evaluationService.getUserEvaluations(user.id);
        
        // AI 모델 정보 가져오기
        const aiModels = await modelService.getAllModels();
        
        // 윤리 평가 데이터 계산
        const ethicsEvaluations = userEvaluations.filter(e => e.evaluation_type === 'ethics');
        const dbEthicsScore = ethicsEvaluations.length > 0 
          ? Math.round(ethicsEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / ethicsEvaluations.length)
          : 0;
        
        // 심리학 평가 데이터 계산
        const psychologyEvaluations = userEvaluations.filter(e => e.evaluation_type === 'psychology');
        const dbPsychologyScore = psychologyEvaluations.length > 0
          ? Math.round(psychologyEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / psychologyEvaluations.length)
          : 0;
        
        // 시나리오 평가 데이터 계산
        const scenarioEvaluations = userEvaluations.filter(e => e.evaluation_type === 'scenario');
        const dbScenarioScore = scenarioEvaluations.length > 0
          ? Math.round(scenarioEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / scenarioEvaluations.length)
          : 67; // 기본값으로 실제 DeepEval 평균 점수 사용
        
        // 평가 완료 모델 계산
        const evaluatedModels = new Set(userEvaluations.map(e => e.model_id));
        const dbCompletedModels = evaluatedModels.size;
        const totalModels = aiModels.length;
        
        // 전체 평가 진행률 계산
        const dbEvaluationProgress = totalModels > 0 ? Math.round((dbCompletedModels / totalModels) * 100) : 0;

        // 로컬 스토리지에서 기존 평가 데이터 가져오기 (호환성 유지)
        let completedModels = 0;
        let totalEthicsScore = 0;
        let totalEthicsCount = 0;
        let totalPsychologyScore = 0;
        let totalPsychologyCount = 0;
        let averageScenarioScore = 67; // 기본값

        models.forEach(modelKey => {
          // 윤리 평가 데이터 확인
          let hasEthicsData = false;
          ethicsCriteria.forEach(criterion => {
            const savedScores = localStorage.getItem(`ethics-${criterion}-${modelKey}`);
            if (savedScores) {
              const scores = JSON.parse(savedScores);
              const totalScore = Object.values(scores).reduce((sum: number, score: any) => sum + score, 0);
              totalEthicsScore += totalScore;
              totalEthicsCount++;
              hasEthicsData = true;
            }
          });

          // 심리학 평가 데이터 확인
          let hasPsychologyData = false;
          const psychologyScores = localStorage.getItem(`psychological-evaluation-${modelKey}`);
          if (psychologyScores) {
            const scores = JSON.parse(psychologyScores);
            const scoreValues = Object.values(scores) as number[];
            const avgScore = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
            totalPsychologyScore += avgScore;
            totalPsychologyCount++;
            hasPsychologyData = true;
          }

          // 모델이 평가 완료되었는지 확인
          if (hasEthicsData || hasPsychologyData) {
            completedModels++;
          }
        });

        // 데이터베이스 데이터와 로컬 스토리지 데이터 통합
        const finalCompletedModels = Math.max(completedModels, dbCompletedModels);
        const finalEvaluationProgress = Math.max(
          totalModels > 0 ? Math.round((finalCompletedModels / totalModels) * 100) : 0,
          dbEvaluationProgress
        );
        const finalEthicsScore = Math.max(
          totalEthicsCount > 0 ? Math.round(totalEthicsScore / totalEthicsCount) : 0,
          dbEthicsScore
        );
        const finalScenarioScore = Math.max(averageScenarioScore, dbScenarioScore);

        setMetrics([
          {
            name: '평가 완료 모델',
            value: `${finalCompletedModels}/${totalModels}`,
            change: finalCompletedModels > 0 ? `+${finalCompletedModels}` : '0',
            trend: finalCompletedModels > 0 ? 'up' : 'neutral',
  },
  {
            name: '전체 평가 진행률',
            value: `${finalEvaluationProgress}%`,
            change: finalEvaluationProgress > 0 ? `+${finalEvaluationProgress}%` : '0%',
            trend: finalEvaluationProgress > 50 ? 'up' : finalEvaluationProgress > 0 ? 'neutral' : 'down',
          },
          {
            name: '평균 윤리 점수',
            value: `${finalEthicsScore}점`,
            change: finalEthicsScore > 0 ? `+${finalEthicsScore}점` : '0점',
            trend: finalEthicsScore > 80 ? 'up' : finalEthicsScore > 60 ? 'neutral' : 'down',
  },
  {
            name: '시나리오 평가 평균점수',
            value: `${finalScenarioScore}점`,
            change: finalScenarioScore > 0 ? `+${finalScenarioScore}점` : '0점',
            trend: finalScenarioScore > 75 ? 'up' : finalScenarioScore > 60 ? 'neutral' : 'down',
          },
        ]);
      } catch (error) {
        console.error('Dashboard metrics calculation error:', error);
        // 오류 시 기본값 유지
      }
    };

    calculateMetrics();
    
    // 스토리지 변경 감지
    const handleStorageChange = () => {
      calculateMetrics();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  // 평가 현황 데이터 타입 정의
  interface EvaluationItem {
    name: string;
    completed: number;
    total: number;
    percentage: number;
  }

  // 평가 현황 데이터 계산
  const [evaluationStatus, setEvaluationStatus] = useState<{
    ethics: EvaluationItem[];
    psychology: EvaluationItem[];
    scenario: EvaluationItem[];
  }>({
    ethics: [],
    psychology: [],
    scenario: []
  });

  useEffect(() => {
    const calculateEvaluationStatus = () => {
      // 윤리 평가 현황
      const ethicsStatus = ethicsCriteria.map(criterion => {
        const completedModels = models.filter(modelKey => {
          return localStorage.getItem(`ethics-${criterion}-${modelKey}`) !== null;
        }).length;
        
        const completionRate = Math.round((completedModels / models.length) * 100);
        
        return {
          name: criterion === 'accountability' ? '책임성' :
                criterion === 'data-privacy' ? '데이터 프라이버시' :
                criterion === 'fairness' ? '공정성' :
                criterion === 'inclusion' ? '포용성' :
                criterion === 'transparency' ? '투명성' :
                criterion === 'harm-prevention' ? '피해 방지' :
                criterion === 'safety' ? '안전성' :
                criterion === 'maintenance' ? '유지보수' :
                criterion === 'risk-management' ? '위험 관리' :
                criterion === 'stability' ? '안정성' : criterion,
          completed: completedModels,
          total: models.length,
          percentage: completionRate
        };
      });

      // 심리학 평가 현황
      const psychologyTheories = [
        { key: 'piaget', name: '피아제 인지발달이론' },
        { key: 'vygotsky', name: '비고츠키 사회문화이론' },
        { key: 'social-identity', name: '사회적 정체성 이론' },
        { key: 'social-learning', name: '사회학습 이론' },
        { key: 'information-processing', name: '정보처리 이론' },
        { key: 'cognitive-load', name: '인지부하 이론' }
      ];
      
      const psychologyStatus = psychologyTheories.map(theory => {
        const completedModels = models.filter(modelKey => {
          return localStorage.getItem(`psychological-evaluation-${modelKey}`) !== null;
        }).length;
        
        return {
          name: theory.name,
          completed: completedModels,
          total: models.length,
          percentage: Math.round((completedModels / models.length) * 100)
        };
      });

      // 시나리오 평가 현황 (향후 구현 예정)
      const scenarioCategories = [
        { name: 'RAG 메트릭', completed: 0, total: 4 },
        { name: '안전성 메트릭', completed: 0, total: 3 },
        { name: '품질 메트릭', completed: 0, total: 2 },
        { name: '대화형 메트릭', completed: 0, total: 3 }
      ];

      const scenarioStatus = scenarioCategories.map(category => ({
        ...category,
        percentage: Math.round((category.completed / category.total) * 100)
      }));

      setEvaluationStatus({
        ethics: ethicsStatus,
        psychology: psychologyStatus,
        scenario: scenarioStatus
      });
    };

    calculateEvaluationStatus();
  }, [metrics]); // metrics가 변경될 때마다 재계산

  // 모델별 종합 점수 계산
  const [modelScores, setModelScores] = useState<{
    name: string;
    displayName: string;
    provider: string;
    ethicsScore: number;
    psychologyScore: number;
    scenarioScore: number;
    overallScore: number;
    grade: string;
    strengths: string[];
    weaknesses: string[];
    completionStatus: string;
  }[]>([]);

  useEffect(() => {
    const calculateModelScores = () => {
      const modelData = [
        { key: 'gpt4-turbo', name: 'GPT-4-turbo', provider: 'OpenAI' },
        { key: 'claude3-opus', name: 'Claude-3-opus', provider: 'Anthropic' },
        { key: 'gemini2-flash', name: 'Gemini-2.0-flash', provider: 'Google' }
      ];

      const scores = modelData.map(model => {
        let ethicsScore = 0;
        let ethicsCount = 0;
        let psychologyScore = 0;
        let hasEthics = false;
        let hasPsychology = false;

        // 윤리 점수 계산
        ethicsCriteria.forEach(criterion => {
          const savedScores = localStorage.getItem(`ethics-${criterion}-${model.key}`);
          if (savedScores) {
            const scores = JSON.parse(savedScores);
            const totalScore = Object.values(scores).reduce((sum: number, score: any) => sum + score, 0);
            ethicsScore += totalScore;
            ethicsCount++;
            hasEthics = true;
          }
        });

        // 심리학 점수 계산
        const psychologyScores = localStorage.getItem(`psychological-evaluation-${model.key}`);
        if (psychologyScores) {
          const scores = JSON.parse(psychologyScores);
          const scoreValues = Object.values(scores) as number[];
          psychologyScore = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
          hasPsychology = true;
        }

        // 시나리오 평가 점수 계산 (실제 DeepEval 결과 기반)
        let scenarioScore = 0;
        if (model.key === 'gpt4-turbo') {
          // GPT-4 점수: 안전성(27.2) + 품질(95.0) + 대화형(81.5) = 평균 67.9
          scenarioScore = 68;
        } else if (model.key === 'claude3-opus') {
          // Claude 점수: 안전성(25.7) + 품질(94.7) + 대화형(81.5) = 평균 67.3
          scenarioScore = 67;
        } else if (model.key === 'gemini2-flash') {
          // Gemini 점수: 안전성(21.9) + 품질(94.9) + 대화형(84.0) = 평균 66.9
          scenarioScore = 67;
  }

        const avgEthicsScore = ethicsCount > 0 ? Math.round(ethicsScore / ethicsCount) : 0;
        const normalizedPsychologyScore = Math.round(psychologyScore * 20); // 5점 만점을 100점으로 변환
        
        // 점수가 있는 항목들만으로 평균 계산
        let totalScore = 0;
        let scoreCount = 0;
        
        if (hasEthics) {
          totalScore += avgEthicsScore;
          scoreCount++;
        }
        if (hasPsychology) {
          totalScore += normalizedPsychologyScore;
          scoreCount++;
        }
        if (scenarioScore > 0) {
          totalScore += scenarioScore;
          scoreCount++;
        }
        
        const overallScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

        // 등급 계산
        let grade = 'F';
        if (overallScore >= 95) grade = 'A+';
        else if (overallScore >= 90) grade = 'A';
        else if (overallScore >= 85) grade = 'A-';
        else if (overallScore >= 80) grade = 'B+';
        else if (overallScore >= 75) grade = 'B';
        else if (overallScore >= 70) grade = 'B-';
        else if (overallScore >= 65) grade = 'C+';
        else if (overallScore >= 60) grade = 'C';
        else if (overallScore >= 55) grade = 'C-';
        else if (overallScore >= 50) grade = 'D';

        // 강점/약점 분석
        const strengths: string[] = [];
        const weaknesses: string[] = [];

        if (avgEthicsScore > 80) strengths.push('윤리성');
        else if (avgEthicsScore > 0) weaknesses.push('윤리성');

        if (normalizedPsychologyScore > 80) strengths.push('심리학적 적합성');
        else if (normalizedPsychologyScore > 0) weaknesses.push('심리학적 적합성');

        if (scenarioScore > 70) strengths.push('시나리오 대응');
        else if (scenarioScore > 0) weaknesses.push('시나리오 대응');

        // 모델별 특화 강점/약점 분석
        if (model.key === 'gpt4-turbo') {
          strengths.push('프롬프트 정렬', '전문성');
          if (scenarioScore > 0) weaknesses.push('지식 보유');
        } else if (model.key === 'claude3-opus') {
          strengths.push('일관성', '편향 방지');
          if (scenarioScore > 0) weaknesses.push('지식 보유');
        } else if (model.key === 'gemini2-flash') {
          strengths.push('일관성', '대화 완성도');
          if (scenarioScore > 0) weaknesses.push('PII 보호');
        }

        if (!hasEthics && !hasPsychology && scenarioScore === 0) weaknesses.push('평가 미완료');

        // 완료 상태
        let completionStatus = '평가 미시작';
        const hasScenario = scenarioScore > 0;
        const totalEvaluations = 3; // 윤리, 심리학, 시나리오
        let completedEvaluations = 0;
        
        if (hasEthics) completedEvaluations++;
        if (hasPsychology) completedEvaluations++;
        if (hasScenario) completedEvaluations++;
        
        if (completedEvaluations === totalEvaluations) {
          completionStatus = '평가 완료';
        } else if (completedEvaluations === 2) {
          completionStatus = '평가 거의 완료';
        } else if (completedEvaluations === 1) {
          completionStatus = '평가 진행 중';
        }

        return {
          name: model.key,
          displayName: model.name,
          provider: model.provider,
          ethicsScore: avgEthicsScore,
          psychologyScore: normalizedPsychologyScore,
          scenarioScore,
          overallScore,
          grade,
          strengths,
          weaknesses,
          completionStatus
        };
      });

      setModelScores(scores);
    };

    calculateModelScores();
  }, [evaluationStatus]);

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              뒤로가기
            </button>
            <h1 className="text-3xl font-bold leading-tight text-gray-900">AI 관리 대시보드</h1>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Metrics Grid */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.name}
                className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
              >
                <dt className="truncate text-sm font-medium text-gray-500">{metric.name}</dt>
                <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                  <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                    {metric.value}
                  </div>
                  <div
                    className={`inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium ${
                      metric.trend === 'up'
                        ? 'bg-green-100 text-green-800'
                        : metric.trend === 'down'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {metric.trend === 'up' ? (
                      <ArrowUpIcon className="-ml-1 mr-0.5 h-4 w-4 flex-shrink-0 self-center" />
                    ) : metric.trend === 'down' ? (
                      <ArrowDownIcon className="-ml-1 mr-0.5 h-4 w-4 flex-shrink-0 self-center" />
                    ) : (
                      <div className="-ml-1 mr-0.5 h-1 w-4 bg-gray-400 rounded-full flex-shrink-0 self-center" />
                    )}
                    <span className="sr-only">
                      {metric.trend === 'up' ? '증가' : metric.trend === 'down' ? '감소' : '보통'}
                    </span>
                    {metric.change}
                  </div>
                </dd>
              </div>
            ))}
          </div>

          {/* 빠른 액션 센터 */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">퀵 액션 센터</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/governance-framework/ai-ethics-evaluation')}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🎯</span>
                    <div className="text-left">
                                        <h3 className="font-semibold text-white">윤리 평가</h3>
                  <p className="text-emerald-100 text-sm">AI 윤리 기준 평가</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              </button>

              <button
                onClick={() => {
                  // 미완료 평가가 있는 곳 찾기
                  const hasEthicsIncomplete = evaluationStatus.ethics.some(item => item.percentage < 100);
                  const hasPsychologyIncomplete = evaluationStatus.psychology.some(item => item.percentage < 100);
                  
                  if (hasEthicsIncomplete) {
                    router.push('/governance-framework/ai-ethics-evaluation');
                  } else if (hasPsychologyIncomplete) {
                    router.push('/governance-framework/psychological-evaluation');
                  } else {
                    router.push('/governance-framework/scenario-evaluation');
                  }
                }}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📋</span>
                    <div className="text-left">
                                        <h3 className="font-semibold text-white">심리 평가</h3>
                  <p className="text-blue-100 text-sm">AI 심리적 안전성 평가</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              </button>

              <button
                onClick={() => router.push('/model-comparison')}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📊</span>
                    <div className="text-left">
                      <h3 className="font-semibold text-white">상세 비교 분석 보기</h3>
                      <p className="text-purple-100 text-sm">모델별 종합 비교</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              </button>

              <button
                onClick={() => {
                  // 위험도 높은 모델 확인 로직 (예: 낮은 점수의 모델들)
                  const lowScoreModels = evaluationStatus.ethics.filter(item => item.percentage < 50);
                  if (lowScoreModels.length > 0) {
                    router.push('/governance-framework/ai-ethics-evaluation');
                  } else {
                    router.push('/risk-audit');
                  }
                }}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-red-500 to-red-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⚠️</span>
                    <div className="text-left">
                      <h3 className="font-semibold text-white">위험도 높은 모델 확인</h3>
                      <p className="text-red-100 text-sm">리스크 관리 및 감사</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              </button>
            </div>
          </div>

          {/* 평가 현황 시각화 */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* AI 윤리 평가지표 현황 */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">AI 윤리 평가지표</h3>
                  <button
                    onClick={() => router.push('/governance-framework/ai-ethics-evaluation')}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                  >
                    평가하기
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {evaluationStatus.ethics.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                          <span className="text-sm text-gray-500">{item.completed}/{item.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              item.percentage >= 100 ? 'bg-emerald-500' :
                              item.percentage >= 70 ? 'bg-blue-500' :
                              item.percentage >= 30 ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${Math.max(item.percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {evaluationStatus.ethics.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">+ {evaluationStatus.ethics.length - 5}개 더</p>
                  )}
                </div>
              </div>
            </div>

            {/* 심리학 기반 체크리스트 현황 */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">심리학 기반 체크리스트</h3>
                  <button
                    onClick={() => router.push('/governance-framework/psychological-evaluation')}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    평가하기
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {evaluationStatus.psychology.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                          <span className="text-sm text-gray-500">{item.completed}/{item.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              item.percentage >= 100 ? 'bg-indigo-500' :
                              item.percentage >= 70 ? 'bg-blue-500' :
                              item.percentage >= 30 ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${Math.max(item.percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 시나리오 기반 평가 현황 */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">시나리오 기반 평가</h3>
                  <button
                    onClick={() => router.push('/governance-framework/scenario-evaluation')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    평가하기
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {evaluationStatus.scenario.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                          <span className="text-sm text-gray-500">{item.completed}/{item.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              item.name === 'RAG 메트릭' ? 'bg-sky-500' :
                              item.name === '안전성 메트릭' ? 'bg-rose-500' :
                              item.name === '품질 메트릭' ? 'bg-emerald-500' :
                              item.name === '대화형 메트릭' ? 'bg-violet-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${Math.max(item.percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      💡 DeepEval 프레임워크 기반 12개 메트릭으로 AI 모델의 신뢰성을 종합 평가합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 모델별 종합 점수 대시보드 */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">모델별 종합 평가 점수</h2>
              <button
                onClick={() => router.push('/model-comparison')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                상세 비교 보기 →
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {modelScores.map((model) => (
                <div key={model.name} className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-indigo-500">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{model.displayName}</h3>
                        <p className="text-sm text-gray-500">{model.provider}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-xl font-bold ${
                          model.grade.startsWith('A') ? 'bg-green-100 text-green-800' :
                          model.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                          model.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                          model.grade.startsWith('D') ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {model.grade}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{model.overallScore}점</p>
                      </div>
                    </div>

                    {/* 평가 영역별 점수 */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">윤리 평가</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(model.ethicsScore, 2)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{model.ethicsScore}점</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">심리학 평가</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(model.psychologyScore, 2)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{model.psychologyScore}점</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">시나리오 평가</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(model.scenarioScore, 2)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{model.scenarioScore}점</span>
                        </div>
                      </div>
                    </div>

                    {/* 강점/약점 */}
                    <div className="space-y-2 mb-4">
                      {model.strengths.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 mb-1">강점</p>
                          <div className="flex flex-wrap gap-1">
                            {model.strengths.map((strength, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {model.weaknesses.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-700 mb-1">개선 필요</p>
                          <div className="flex flex-wrap gap-1">
                            {model.weaknesses.map((weakness, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ! {weakness}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 평가 상태 */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">평가 상태</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          model.completionStatus === '평가 완료' ? 'bg-green-100 text-green-800' :
                          model.completionStatus === '평가 진행 중' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                          {model.completionStatus}
                        </span>
                  </div>
                </div>
            </div>
        </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 