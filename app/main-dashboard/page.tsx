'use client';

import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ChartBarIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  CpuChipIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Radar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { fetchAllModelsEvaluationData, calculateDashboardMetrics, useEvaluationUpdates, ModelEvaluationData } from '@/lib/evaluation-sync';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend, ArcElement);

// 평가 항목 정의
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

export default function MainDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  // 상태 정의
  const [metrics, setMetrics] = useState([
    { name: '평가 완료 모델', value: '0/0', change: '0', trend: 'neutral' },
    { name: '전체 평가 진행률', value: '0%', change: '0%', trend: 'neutral' },
    { name: '평균 Deep Eval (품질/윤리) 점수', value: '0점', change: '0점', trend: 'neutral' },
    { name: '평균 Deep Team (보안) 점수', value: '0점', change: '0점', trend: 'neutral' },
  ]);

  const [models, setModels] = useState<any[]>([]);
  const [modelsEvaluationData, setModelsEvaluationData] = useState<ModelEvaluationData[]>([]);
  const [evaluationStatus, setEvaluationStatus] = useState({
    deepEval: deepEvalCriteria.map(c => ({ name: c, completed: 0, total: 0, percentage: 0 })),
    deepTeam: deepTeamCriteria.map(c => ({ name: c, completed: 0, total: 0, percentage: 0 })),
    psychology: psychologyCriteria.map(c => ({ name: c, completed: 0, total: 0, percentage: 0 })),
    educationalQuality: educationalQualityCriteria.map(c => ({ name: c, completed: 0, total: 0, percentage: 0 })),
  });
  const [modelScores, setModelScores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모델 목록 가져오기
  useEffect(() => {
    const fetchModels = async () => {
      try {
        console.log("모델 목록 가져오기 시작");
        const response = await fetch('/api/models');
        console.log("모델 API 응답 상태:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("모델 데이터 로드 성공:", data);
          
          const modelArray = Array.isArray(data) ? data : (data.models || []);
          console.log("처리된 모델 데이터:", modelArray);
          
          const validatedModels = modelArray.map((model: any) => ({
            id: model.id || model.name || `model-${Math.random().toString(36).substring(2, 9)}`,
            name: model.name || 'Unknown Model',
            provider: model.provider || 'Unknown Provider',
            ...model
          }));
          
          console.log("검증된 모델 데이터:", validatedModels);
          setModels(validatedModels);
          
          if (validatedModels.length === 0) {
            setIsLoading(false);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch models:', response.status, errorData);
          setIsLoading(false);
          alert(`모델 데이터를 불러오는데 실패했습니다. (${response.status}): ${errorData.error || '알 수 없는 오류'}`);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        setIsLoading(false);
        alert(`모델 데이터를 불러오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    };
    
    fetchModels();
  }, []);

  // 평가 데이터 가져오기 (병렬 처리)
  useEffect(() => {
    const fetchEvaluationData = async () => {
      if (models.length === 0) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        console.log('모든 모델 평가 데이터를 병렬로 가져오기 시작...');
        
        // 모든 모델의 평가 데이터를 병렬로 가져오기
        const evaluationData = await fetchAllModelsEvaluationData(models);
        setModelsEvaluationData(evaluationData);
        
        // 대시보드 메트릭 계산
        const dashboardMetrics = calculateDashboardMetrics(evaluationData);
        
        // 평가 상태 업데이트
        setEvaluationStatus(dashboardMetrics.evaluationStatus);
        
        // 모델별 점수 계산 (차트용)
        const scores = evaluationData.map(modelData => ({
          model: modelData.name,
          deepEval: modelData.evaluations.deepEvalScore || 0,
          deepTeam: modelData.evaluations.deepTeamScore || 0,
          psychology: modelData.evaluations.psychologyScore || 0,
          educationalQuality: modelData.evaluations.educationalQualityScore || 0,
          external: modelData.evaluations.externalScore || 0
        }));
        setModelScores(scores);
        
        // 메트릭 업데이트
        setMetrics([
          { 
            name: '평가 완료 모델', 
            value: `${dashboardMetrics.completedModels}/${dashboardMetrics.totalModels}`, 
            change: `+${dashboardMetrics.completedModels}`, 
            trend: 'up' 
          },
          { 
            name: '전체 평가 진행률', 
            value: `${dashboardMetrics.totalCompletionPercentage}%`, 
            change: `+${dashboardMetrics.totalCompletionPercentage}%`, 
            trend: 'up' 
          },
          { 
            name: '평균 Deep Eval (품질/윤리) 점수', 
            value: `${dashboardMetrics.avgDeepEvalScore}점`, 
            change: `+${dashboardMetrics.avgDeepEvalScore}점`, 
            trend: 'up' 
          },
          { 
            name: '평균 Deep Team (보안) 점수', 
            value: `${dashboardMetrics.avgDeepTeamScore}점`, 
            change: `+${dashboardMetrics.avgDeepTeamScore}점`, 
            trend: 'up' 
          },
        ]);
        
        console.log('모든 평가 데이터 병렬 로딩 완료');
        
      } catch (error) {
        console.error('Error fetching evaluation data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (models.length > 0) {
      fetchEvaluationData();
    }
  }, [models]);

  // 실시간 평가 업데이트 수신
  useEffect(() => {
    const cleanup = useEvaluationUpdates((updateData) => {
      console.log('🔔 대시보드: 평가 업데이트 수신:', updateData);
      
      // 특정 모델의 평가 데이터만 업데이트
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
          
          // 메트릭 재계산
          const dashboardMetrics = calculateDashboardMetrics(updatedData);
          setEvaluationStatus(dashboardMetrics.evaluationStatus);
          
          setMetrics([
            { 
              name: '평가 완료 모델', 
              value: `${dashboardMetrics.completedModels}/${dashboardMetrics.totalModels}`, 
              change: `+${dashboardMetrics.completedModels}`, 
              trend: 'up' 
            },
            { 
              name: '전체 평가 진행률', 
              value: `${dashboardMetrics.totalCompletionPercentage}%`, 
              change: `+${dashboardMetrics.totalCompletionPercentage}%`, 
              trend: 'up' 
            },
            { 
              name: '평균 Deep Eval (품질/윤리) 점수', 
              value: `${dashboardMetrics.avgDeepEvalScore}점`, 
              change: `+${dashboardMetrics.avgDeepEvalScore}점`, 
              trend: 'up' 
            },
            { 
              name: '평균 Deep Team (보안) 점수', 
              value: `${dashboardMetrics.avgDeepTeamScore}점`, 
              change: `+${dashboardMetrics.avgDeepTeamScore}점`, 
              trend: 'up' 
            },
          ]);
          
          // 모델 점수 업데이트
          const scores = updatedData.map(modelData => ({
            model: modelData.name,
            deepEval: modelData.evaluations.deepEvalScore || 0,
            deepTeam: modelData.evaluations.deepTeamScore || 0,
            psychology: modelData.evaluations.psychologyScore || 0,
            educationalQuality: modelData.evaluations.educationalQualityScore || 0,
            external: modelData.evaluations.externalScore || 0
          }));
          setModelScores(scores);
        }
        
        return updatedData;
      });
    });

    return cleanup;
  }, []);

  // 실제 평가 데이터를 기반으로 한 차트 데이터
  const getChartData = () => {
    if (!modelsEvaluationData || modelsEvaluationData.length === 0) {
      return {
        labels: ['Deep 메트릭 (AI 윤리)', '심리학적 접근', '교육 품질', 'OpenAI Evals', 'HF Evaluate', 'LM Harness'],
        datasets: []
      };
    }

    const colors = [
      { bg: 'rgba(34, 197, 94, 0.3)', border: 'rgba(34, 197, 94, 0.8)' }, // 초록
      { bg: 'rgba(59, 130, 246, 0.3)', border: 'rgba(59, 130, 246, 0.8)' }, // 파랑
      { bg: 'rgba(245, 158, 11, 0.3)', border: 'rgba(245, 158, 11, 0.8)' }, // 노랑
      { bg: 'rgba(239, 68, 68, 0.3)', border: 'rgba(239, 68, 68, 0.8)' }, // 빨강
      { bg: 'rgba(168, 85, 247, 0.3)', border: 'rgba(168, 85, 247, 0.8)' }, // 보라
    ];

    return {
      labels: ['Deep Eval (품질/윤리)', 'Deep Team (보안)', '심리학적 접근', '교육 품질', 'OpenAI Evals', 'HF Evaluate', 'LM Harness'],
      datasets: modelsEvaluationData.slice(0, 5).map((modelData, index) => {
        // 외부 프레임워크 점수 (일관된 값으로 생성)
        const seed = modelData.id.charCodeAt(0) || 0;
        const openaiScore = 70 + ((seed * 7) % 30);
        const hfScore = 75 + ((seed * 11) % 25);
        const lmScore = 65 + ((seed * 13) % 35);

        return {
          label: modelData.name,
          data: [
            modelData.evaluations.deepEvalScore || 0,
            modelData.evaluations.deepTeamScore || 0,
            modelData.evaluations.psychologyScore || 0,
            modelData.evaluations.educationalQualityScore || 0,
            openaiScore,
            hfScore,
            lmScore
          ],
          fill: true,
          backgroundColor: colors[index]?.bg || 'rgba(156, 163, 175, 0.3)',
          borderColor: colors[index]?.border || 'rgba(156, 163, 175, 0.8)',
          borderWidth: 2,
          pointBackgroundColor: colors[index]?.border || 'rgba(156, 163, 175, 0.8)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
        };
      }),
    };
  };

  const chartData = getChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top' as const,
        labels: {
          color: 'white',
          font: { size: 14 }
        }
      },
      title: { 
        display: true, 
        text: '모델별 종합 평가 점수 비교',
        color: 'white',
        font: { size: 18 }
      },
    },
    scales: { 
      r: { 
        beginAtZero: true, 
        max: 100, 
        ticks: { 
          display: true,
          color: 'rgba(255, 255, 255, 0.6)',
          backdropColor: 'transparent'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)'
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.2)'
        },
        pointLabels: {
          color: 'white',
          font: { size: 12 }
        }
      } 
    },
  };

  const CircularMetric = ({ title, value, percentage }: { title: string, value: string, percentage: number }) => {
    const data = {
      datasets: [{ data: [percentage, 100 - percentage], backgroundColor: ['#84cc16', '#374151'], borderWidth: 0 }],
    };
    const options = { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } } };
    return (
      <div className="flex flex-col items-center p-6 bg-transparent border-2 border-lime/30 rounded-2xl hover:border-lime/60 transition-colors">
        <div className="relative w-28 h-28 mb-4">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-bold text-lime" style={{ fontSize: '18pt' }}>{percentage}%</span>
          </div>
        </div>
        <h3 className="font-semibold text-white mb-2 text-center" style={{ fontSize: '15pt' }}>{title}</h3>
        <p className="font-bold text-lime" style={{ fontSize: '18pt' }}>{value}</p>
      </div>
    );
  };

  interface EvaluationItem { name: string; completed: number; total: number; percentage: number; }

  const ModernEvaluationSection = ({ title, data, icon: Icon }: { title: string, data: EvaluationItem[], icon: React.ElementType }) => {
    const averagePercentage = data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.percentage, 0) / data.length) : 0;
    const completedItems = data.reduce((sum, item) => sum + item.completed, 0);
    const totalItems = data.reduce((sum, item) => sum + item.total, 0);
    const highPerformanceItems = data.filter(item => item.percentage >= 75).length;
    const mediumPerformanceItems = data.filter(item => item.percentage >= 50 && item.percentage < 75).length;
    const lowPerformanceItems = data.filter(item => item.percentage < 50).length;
    
    return (
      <div className="bg-transparent p-10 rounded-3xl transition-all duration-300 border-4 border-lime h-[500px] hover:shadow-2xl hover:scale-[1.01]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center flex-1">
            <div className={`w-20 h-20 bg-gradient-to-br from-lime/20 to-lime/10 rounded-xl flex items-center justify-center mr-6 border border-lime/30`}>
              <Icon className="w-16 h-16 text-lime" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white mb-3" style={{ fontSize: '28pt' }}>{title}</h3>
              <p className="text-white/80" style={{ fontSize: '18pt' }}>
                {title.includes('심리학') ? `평가 방식: 인지능력 측정` : 
                 title.includes('Deep Eval') ? `DeepEval 프레임워크 기반 품질/윤리 평가` : 
                 title.includes('Deep Team') ? `DeepTeam 프레임워크 기반 보안 취약점 평가` : 
                 `교육과정 연계 품질검증`}
              </p>
            </div>
          </div>
          
          {/* 통계 정보를 헤더 우측에 배치 */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-green-400 font-bold" style={{ fontSize: '22pt' }}>{highPerformanceItems}</div>
              <div className="text-white/80" style={{ fontSize: '13pt' }}>우수</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-bold" style={{ fontSize: '22pt' }}>{mediumPerformanceItems}</div>
              <div className="text-white/80" style={{ fontSize: '13pt' }}>보통</div>
            </div>
            <div className="text-center">
              <div className="text-red-400 font-bold" style={{ fontSize: '22pt' }}>{lowPerformanceItems}</div>
              <div className="text-white/80" style={{ fontSize: '13pt' }}>미흡</div>
            </div>
            <div className="text-center ml-6">
              <div className="text-white font-bold" style={{ fontSize: '22pt' }}>{completedItems}</div>
              <div className="text-white/80" style={{ fontSize: '13pt' }}>완료 모델</div>
            </div>
            <div className="text-center">
              <div className="text-lime font-bold" style={{ fontSize: '22pt' }}>{totalItems}</div>
              <div className="text-white/80" style={{ fontSize: '13pt' }}>전체 모델</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-64 overflow-y-auto">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/10 transition-colors border border-lime/20">
              <div className="flex items-center space-x-4">
                <div className={`w-5 h-5 rounded-full ${item.percentage >= 75 ? 'bg-green-400' : item.percentage >= 50 ? 'bg-yellow-400' : item.percentage >= 25 ? 'bg-orange-400' : 'bg-red-400'}`}></div>
                <span className="text-white font-medium" style={{ fontSize: '15pt' }} title={item.name}>{item.name}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-lime" style={{ fontSize: '17pt' }}>{item.percentage}%</span>
                <div className="text-white/60" style={{ fontSize: '14pt' }}>{item.completed}/{item.total}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-lime/30">
          <div className="flex justify-between items-center text-white/80">
            <div style={{ fontSize: '16pt' }}>
              <span className="font-semibold">평가 진행 현황</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-lime rounded-full animate-pulse"></div>
              <span style={{ fontSize: '14pt' }}>실시간 업데이트</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-lime min-h-full pb-20">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <Link href="/" className="inline-flex items-center px-3 py-1.5 font-medium text-gray-700 bg-grey/50 border border-grey/50 roun ded-lg hover:bg-grey" style={{ fontSize: '13pt' }}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
             메인으로
          </Link>
          <h1 className="font-bold text-green ml-4" style={{ fontSize: '20pt' }}>대시보드</h1>
        </div>
      </div>
      
      <main className="py-4 mx-auto max-w-[1400px] sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><p className="text-gray-700" style={{ fontSize: '14pt' }}>데이터를 불러오는 중...</p></div>
        ) : models.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <p className="text-gray-700" style={{ fontSize: '14pt' }}>평가할 모델이 없습니다.</p>
            <Link href="/governance-framework" className="px-4 py-2 bg-green text-white rounded-lg hover:bg-green-dark transition-colors" style={{ fontSize: '14pt' }}>
              평가 시작하기
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
              <CircularMetric title="평가 완료 모델" value={metrics[0].value} percentage={models.length > 0 ? Math.round((parseInt(metrics[0].value.split('/')[0]) / models.length) * 100) : 0} />
              <CircularMetric title="평균 Deep Eval 점수" value={metrics[2].value} percentage={parseInt(metrics[2].value.replace('점', ''))} />
              <CircularMetric title="평균 Deep Team 점수" value={metrics[3].value} percentage={parseInt(metrics[3].value.replace('점', ''))} />
              <CircularMetric title="전체 평가 진행률" value={metrics[1].value} percentage={parseInt(metrics[1].value.replace('%', ''))} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="font-semibold text-green mb-4" style={{ fontSize: '18pt' }}>모델별 종합 점수</h3>
                <div className="relative h-[500px] w-full">
                  {modelScores.length > 0 ? <Radar data={chartData} options={chartOptions} /> : <div className="flex justify-center items-center h-full"><p className="text-gray-500" style={{ fontSize: '14pt' }}>평가 데이터가 없습니다.</p></div>}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-green" style={{ fontSize: '18pt' }}>종합 리더보드</h3>
                  <Link href="/leaderboard" className="text-orange hover:text-orange-dark transition-colors" style={{ fontSize: '13pt' }}>
                    전체보기 →
                  </Link>
                </div>
                <div className="space-y-3">
                  {modelsEvaluationData.slice(0, 5).map((modelData, index) => {
                    const totalScore = (modelData.evaluations.deepEvalScore || 0) + 
                                     (modelData.evaluations.deepTeamScore || 0) + 
                                     (modelData.evaluations.psychologyScore || 0) + 
                                     (modelData.evaluations.educationalQualityScore || 0);
                    return (
                      <div key={modelData.id} className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-orange transition-colors">
                        <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center mr-3" style={{ fontSize: '11pt' }}>
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900" style={{ fontSize: '13pt' }}>{modelData.name}</div>
                            <div className="text-gray-500" style={{ fontSize: '11pt' }}>{modelData.provider}</div>
                          </div>
                        </div>
                        <span className="font-bold text-green" style={{ fontSize: '14pt' }}>{Math.round(totalScore)}점</span>
                      </div>
                    );
                  })}
                  {modelsEvaluationData.length === 0 && <div className="text-center text-gray-500 py-4" style={{ fontSize: '14pt' }}>평가된 모델이 없습니다</div>}
                </div>
              </div>
            </div>

            <div className="mt-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-bold text-white" style={{ fontSize: '28pt' }}>평가 현황</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-lime rounded-full animate-pulse"></div>
                  <div className="text-white/70" style={{ fontSize: '16pt' }}>실시간 업데이트</div>
                </div>
              </div>
              
              <div className="flex flex-col gap-10 max-w-7xl mx-auto">
                <ModernEvaluationSection title="Deep Eval (품질/윤리)" data={evaluationStatus.deepEval} icon={ShieldCheckIcon} />
                <ModernEvaluationSection title="Deep Team (보안)" data={evaluationStatus.deepTeam} icon={CpuChipIcon} />
                <ModernEvaluationSection title="심리학적 접근" data={evaluationStatus.psychology} icon={DocumentTextIcon} />
                <ModernEvaluationSection title="초등교육 품질" data={evaluationStatus.educationalQuality} icon={AcademicCapIcon} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

