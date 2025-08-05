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
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend, ArcElement);

// 평가 항목 정의
const ethicsCriteria = [
  '책임성', '데이터 프라이버시', '공정성', '포용성', '투명성', 
  '위해 방지', '안전성', '유지보수성', '위험 관리', '안정성'
];

const psychologyCriteria = [
  '피아제 인지발달이론', '비고츠키 사회문화이론', '사회적 정체성 이론', 
  '사회학습 이론', '정보처리 이론', '인지부하 이론'
];

const scenarioCriteria = [
  'RAG 메트릭', '안전성 메트릭', '품질 메트릭', '대화형 메트릭'
];

const deepMetricsCriteria = [
  '일관성 평가', '정확성 평가', '편향성 탐지', '해석가능성'
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
    { name: '평균 윤리 점수', value: '0점', change: '0점', trend: 'neutral' },
    { name: '시나리오 평가 평균점수', value: '0점', change: '0점', trend: 'neutral' },
  ]);

  const [models, setModels] = useState<any[]>([]);
  const [evaluationStatus, setEvaluationStatus] = useState({
    ethics: ethicsCriteria.map(c => ({ name: c, completed: 0, total: 0, percentage: 0 })),
    psychology: psychologyCriteria.map(c => ({ name: c, completed: 0, total: 0, percentage: 0 })),
    scenario: scenarioCriteria.map(c => ({ name: c, completed: 0, total: 0, percentage: 0 })),
    deepMetrics: deepMetricsCriteria.map(c => ({ name: c, completed: 0, total: 0, percentage: 0 })),
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
          
          // API 응답 구조에 따라 모델 데이터 추출
          const modelArray = Array.isArray(data) ? data : (data.models || []);
          console.log("처리된 모델 데이터:", modelArray);
          
          // 모델 데이터 구조 검증 및 필요한 경우 변환
          const validatedModels = modelArray.map((model: any) => {
            // 필요한 속성이 있는지 확인하고, 없으면 기본값 제공
            return {
              id: model.id || model.name || `model-${Math.random().toString(36).substring(2, 9)}`,
              name: model.name || 'Unknown Model',
              provider: model.provider || 'Unknown Provider',
              ...model
            };
          });
          
          console.log("검증된 모델 데이터:", validatedModels);
          setModels(validatedModels);
          
          if (validatedModels.length === 0) {
            // 모델이 없으면 로딩 상태 해제
            setIsLoading(false);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch models:', response.status, errorData);
          setIsLoading(false); // 에러 시 로딩 상태 해제
          alert(`모델 데이터를 불러오는데 실패했습니다. (${response.status}): ${errorData.error || '알 수 없는 오류'}`);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        setIsLoading(false); // 에러 시 로딩 상태 해제
        alert(`모델 데이터를 불러오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    };
    
    fetchModels();
  }, []);

  // 평가 데이터 가져오기
  useEffect(() => {
    const fetchEvaluationData = async () => {
      console.log("fetchEvaluationData 함수 호출됨, 모델 수:", models.length);
      
      // 인증 확인 부분 주석 처리 - 테스트 목적으로 인증 없이도 진행
      /*
      if (!user) {
        console.log("사용자 인증 없음, 데이터 로딩 중단");
        setIsLoading(false);
        return;
      }
      */
      
      if (models.length === 0) {
        console.log("모델 데이터 없음, 데이터 로딩 중단");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      console.log("평가 데이터 가져오기 시작, 모델 수:", models.length);
      
      try {
        // 1. 윤리 평가 데이터 가져오기
        const ethicsData: any = {};
        console.log("윤리 평가 데이터 가져오기 시작");
        for (const model of models) {
          console.log("모델 ID:", model.id, "에 대한 윤리 평가 데이터 요청");
          try {
            const response = await fetch(`/api/evaluation/ethics?modelId=${model.id}`);
            console.log("윤리 평가 API 응답 상태:", response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log("모델 ID:", model.id, "윤리 평가 데이터:", data);
              ethicsData[model.id] = data;
            } else {
              const errorData = await response.json().catch(() => ({}));
              console.error("윤리 평가 데이터 가져오기 실패:", response.status, errorData);
              // 오류 발생 시 빈 배열로 초기화
              ethicsData[model.id] = [];
            }
          } catch (error) {
            console.error(`모델 ${model.id}의 윤리 평가 데이터 요청 중 오류:`, error);
            ethicsData[model.id] = [];
          }
        }
        
        // 2. 심리학적 평가 데이터 가져오기
        const psychologyData: any = {};
        console.log("심리학적 평가 데이터 가져오기 시작");
        for (const model of models) {
          console.log("모델 ID:", model.id, "에 대한 심리학적 평가 데이터 요청");
          try {
            const response = await fetch(`/api/evaluation/psychological?modelId=${model.id}`);
            console.log("심리학적 평가 API 응답 상태:", response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log("모델 ID:", model.id, "심리학적 평가 데이터:", data);
              if (data) psychologyData[model.id] = data;
            } else {
              const errorData = await response.json().catch(() => ({}));
              console.error("심리학적 평가 데이터 가져오기 실패:", response.status, errorData);
            }
          } catch (error) {
            console.error(`모델 ${model.id}의 심리학적 평가 데이터 요청 중 오류:`, error);
          }
        }
        
        // 3. 평가 현황 계산
        try {
          const ethicsStatus = ethicsCriteria.map(criterion => {
            const completed = Object.values(ethicsData).filter((modelData: any) => 
              modelData && modelData.some((evalItem: any) => evalItem.category === criterion)
            ).length;
            
            return {
              name: criterion,
              completed,
              total: models.length,
              percentage: models.length > 0 ? Math.round((completed / models.length) * 100) : 0
            };
          });
          
          const psychologyStatus = psychologyCriteria.map(criterion => {
            // 심리학적 평가는 모델당 하나의 평가만 있으므로 단순히 데이터가 있는지 확인
            const completed = Object.values(psychologyData).length;
            
            return {
              name: criterion,
              completed,
              total: models.length,
              percentage: models.length > 0 ? Math.round((completed / models.length) * 100) : 0
            };
          });
          
          // 시나리오 평가는 아직 구현되지 않았으므로 기본값 유지
          
          setEvaluationStatus({
            ethics: ethicsStatus,
            psychology: psychologyStatus,
            scenario: evaluationStatus.scenario, // 기존 값 유지
            deepMetrics: evaluationStatus.deepMetrics, // 기존 값 유지
            educationalQuality: evaluationStatus.educationalQuality // 기존 값 유지
          });
        } catch (error) {
          console.error("평가 현황 계산 중 오류:", error);
        }
        
        // 4. 모델별 점수 계산
        try {
          const scores = models.map(model => {
            const modelEthicsData = ethicsData[model.id] || [];
            const modelPsychologyData = psychologyData[model.id];
            
            // 윤리 평가 평균 점수
            const ethicsScores = modelEthicsData.map((evalItem: any) => evalItem.score || 0);
            const ethicsAvg = ethicsScores.length > 0 
              ? Math.round(ethicsScores.reduce((a: number, b: number) => a + b, 0) / ethicsScores.length) 
              : 0;
            
            // 심리학적 평가 점수
            const psychologyScore = modelPsychologyData ? modelPsychologyData.percentage || 0 : 0;
            
            // 시나리오 평가 점수 (아직 구현되지 않음)
            const scenarioScore = 0;
            
            return {
              model: model.name,
              ethics: ethicsAvg,
              psychology: psychologyScore,
              scenario: scenarioScore
            };
          });
          
          setModelScores(scores);
        } catch (error) {
          console.error("모델별 점수 계산 중 오류:", error);
        }
        
        // 5. 메트릭 업데이트 (오류가 발생해도 기본 데이터 표시)
        try {
          const completedModels = modelScores.filter(s => s.ethics > 0 || s.psychology > 0).length;
          const avgEthicsScore = modelScores.reduce((sum, s) => sum + s.ethics, 0) / modelScores.length || 0;
          const avgScenarioScore = modelScores.reduce((sum, s) => sum + s.scenario, 0) / modelScores.length || 0;
          const totalCompletionPercentage = Math.round(
            (evaluationStatus.ethics.reduce((sum, s) => sum + s.percentage, 0) / (evaluationStatus.ethics.length * 100) +
             evaluationStatus.psychology.reduce((sum, s) => sum + s.percentage, 0) / (evaluationStatus.psychology.length * 100)) * 50
          );
          
          setMetrics([
            { 
              name: '평가 완료 모델', 
              value: `${completedModels}/${models.length}`, 
              change: `+${completedModels}`, 
              trend: 'up' 
            },
            { 
              name: '전체 평가 진행률', 
              value: `${totalCompletionPercentage}%`, 
              change: `+${totalCompletionPercentage}%`, 
              trend: 'up' 
            },
            { 
              name: '평균 윤리 점수', 
              value: `${Math.round(avgEthicsScore)}점`, 
              change: `+${Math.round(avgEthicsScore)}점`, 
              trend: 'up' 
            },
            { 
              name: '평균 심리학 점수', 
              value: `${Math.round(modelScores.reduce((sum, s) => sum + s.psychology, 0) / modelScores.length || 0)}점`, 
              change: `+${Math.round(modelScores.reduce((sum, s) => sum + s.psychology, 0) / modelScores.length || 0)}점`, 
              trend: 'up' 
            },
          ]);
        } catch (error) {
          console.error("메트릭 업데이트 오류:", error);
          // 기본 메트릭 설정
          setMetrics([
            { name: '평가 완료 모델', value: `0/${models.length}`, change: '0', trend: 'neutral' },
            { name: '전체 평가 진행률', value: '0%', change: '0%', trend: 'neutral' },
            { name: '평균 윤리 점수', value: '0점', change: '0점', trend: 'neutral' },
            { name: '평균 심리학 점수', value: '0점', change: '0점', trend: 'neutral' },
          ]);
        }
        
      } catch (error) {
        console.error('Error fetching evaluation data:', error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    // 모델 데이터가 있을 때만 실행 (인증 확인 제거)
    if (models.length > 0) {
      console.log("모델 정보가 있어 평가 데이터를 가져옵니다.");
      fetchEvaluationData();
    } else {
      console.log("모델 정보가 없어 평가 데이터를 가져오지 않습니다.", {
        modelsLength: models.length
      });
    }
  }, [models]);

  // 데모용 임의 점수 데이터
  const chartData = {
    labels: [
      '윤리 점수',
      '심리학 점수',
      '시나리오 점수',
      '성능 점수',
      '안전 점수',
      '사용성 점수',
    ],
    datasets: [
      {
        label: '모델 A',
        data: [75, 60, 85, 70, 65, 80],
        fill: true,
        backgroundColor: 'rgba(255, 166, 0, 0.57)',
        borderColor: 'rgba(255, 166, 0, 0.7)',
        borderWidth: 2,
      },
      {
        label: '모델 B',
        data: [50, 80, 70, 60, 75, 55],
        fill: true,
        backgroundColor: 'rgba(255, 191, 0, 0.56)',
        borderColor: 'rgba(255, 140, 0, 0.5)',
        borderWidth: 2,
      },
      {
        label: '모델 C',
        data: [90, 65, 55, 85, 60, 70],
        fill: true,
        backgroundColor: 'rgba(255, 208, 0, 0.75)',
        borderColor: 'rgba(255, 100, 0, 0.3)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // 컨테이너에 맞춰 가득 채우기
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: '모델별 종합 점수 비교' },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { display: false }, // 숫자 눈금 숨기기
      },
    },
  };

  const renderTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpIcon className="w-4 h-4 text-green" />;
    if (trend === 'down') return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
    return <span className="w-4 h-4">-</span>;
  };
  
  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-green';
    if (trend === 'down') return 'text-red-500';
    return 'text-gray-600';
  };

  // 도넛차트 컴포넌트
  const CircularMetric = ({ title, value, percentage }: { title: string, value: string, percentage: number }) => {
    const chartData = {
      datasets: [{
        data: [percentage, 100 - percentage],
        backgroundColor: ['#FFA500', '#f3f4f6'],
        borderWidth: 0,
      }],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    };

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 mb-3">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-green">{percentage}%</span>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-green mb-1 text-center">{title}</h3>
        <p className="text-lg font-bold text-green">{value}</p>
      </div>
    );
  };

  interface EvaluationItem {
    name: string;
    completed: number;
    total: number;
    percentage: number;
  }

  // 새로운 평가 섹션 컴포넌트 - 원형 진행률과 체크리스트 스타일
  const ModernEvaluationSection = ({ title, data, icon: Icon }: { title: string, data: EvaluationItem[], icon: React.ElementType }) => {
    const averagePercentage = data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.percentage, 0) / data.length) : 0;
    
    return (
      <div className="bg-transparent p-8 rounded-2xl transition-all duration-300 border border-orange h-80">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-14 h-14 bg-transparent rounded-xl flex items-center justify-center mr-4`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="text-base text-white/80">진행률 {averagePercentage}%</p>
            </div>
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="35"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="35"
                stroke="#FFA500"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${averagePercentage * 2.2} 220`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-bold text-white">{averagePercentage}%</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  item.percentage >= 75 ? 'bg-green-400' : 
                  item.percentage >= 50 ? 'bg-yellow-400' : 
                  item.percentage >= 25 ? 'bg-orange-400' : 'bg-red-400'
                }`}></div>
                <span className="text-sm text-white" title={item.name}>
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-medium text-white/80">{item.percentage}%</span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-orange/30">
          <div className="flex justify-between text-sm text-white/80">
            <span>완료: {data.reduce((sum, item) => sum + item.completed, 0)}</span>
            <span>전체: {data.reduce((sum, item) => sum + item.total, 0)}</span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-lime min-h-screen">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <Link
            href="/"
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-grey/50 border border-grey/50 roun ded-lg hover:bg-grey"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
             메인으로
          </Link>
          <h1 className="text-xl font-bold text-green ml-4">대시보드</h1>
        </div>
      </div>
      
      <main className="py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-700">데이터를 불러오는 중...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <p className="text-gray-700">평가할 모델이 없습니다.</p>
            <Link
              href="/governance-framework"
              className="px-4 py-2 bg-green text-white rounded-lg hover:bg-green-dark transition-colors"
            >
              평가 시작하기
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
              <CircularMetric 
                title="평가 완료 모델" 
                value={metrics[0].value} 
                percentage={models.length > 0 ? Math.round((parseInt(metrics[0].value.split('/')[0]) / models.length) * 100) : 0}
              />
              <CircularMetric 
                title="평균 종합 점수" 
                value={`${Math.round((parseInt(metrics[2].value.replace('점', '')) + parseInt(metrics[3].value.replace('점', ''))) / 2)}점`}
                percentage={Math.round((parseInt(metrics[2].value.replace('점', '')) + parseInt(metrics[3].value.replace('점', ''))) / 2)}
              />
              <CircularMetric 
                title="평균 윤리 점수" 
                value={metrics[2].value} 
                percentage={parseInt(metrics[2].value.replace('점', ''))}
              />
              <CircularMetric 
                title="전체 평가 진행률" 
                value={metrics[1].value} 
                percentage={parseInt(metrics[1].value.replace('%', ''))}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-green mb-4">모델별 종합 점수</h3>
                <div className="relative h-[500px] w-full">
                  {modelScores.length > 0 ? (
                    <Radar data={chartData} options={chartOptions} />
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">평가 데이터가 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green">종합 리더보드</h3>
                  <Link
                    href="/leaderboard"
                    className="text-sm text-orange hover:text-orange-dark transition-colors"
                  >
                    전체보기 →
                  </Link>
                </div>
                <div className="space-y-3">
                  {models.slice(0, 5).map((model, index) => {
                    const totalScore = (model.ethicsScore || 0) + (model.psychologyScore || 0) + (model.scenarioScore || 0);
                    return (
                      <div key={model.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center mr-3 text-xs">
                            {index + 1}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{model.name}</div>
                            <div className="text-xs text-gray-500">{model.provider}</div>
                          </div>
                        </div>
                        <span className="font-bold text-green">{totalScore}점</span>
                      </div>
                    );
                  })}
                  {models.length === 0 && (
                    <div className="text-center text-gray-500 py-4">평가된 모델이 없습니다</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-green">평가 현황</h2>
                <div className="text-sm text-gray-500">실시간 업데이트</div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ModernEvaluationSection 
                  title="AI 윤리" 
                  data={evaluationStatus.ethics} 
                  icon={ShieldCheckIcon} 
                />
                <ModernEvaluationSection 
                  title="심리학적 접근" 
                  data={evaluationStatus.psychology} 
                  icon={DocumentTextIcon} 
                />
                <ModernEvaluationSection 
                  title="Deep 메트릭" 
                  data={evaluationStatus.deepMetrics} 
                  icon={CpuChipIcon} 
                />
                <ModernEvaluationSection 
                  title="초등교육 품질" 
                  data={evaluationStatus.educationalQuality} 
                  icon={AcademicCapIcon} 
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
} 