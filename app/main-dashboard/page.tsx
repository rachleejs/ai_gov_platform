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

const deepMetricsCriteria = [
  '일관성 평가', '정확성 평가', '편향성 탐지', '해석가능성',
  'RAG 메트릭', '안전성 메트릭', '품질 메트릭', '대화형 메트릭'
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
    { name: 'Deep 메트릭 평가 평균점수', value: '0점', change: '0점', trend: 'neutral' },
  ]);

  const [models, setModels] = useState<any[]>([]);
  const [evaluationStatus, setEvaluationStatus] = useState({
    ethics: ethicsCriteria.map(c => ({ name: c, completed: 0, total: 0, percentage: 0 })),
    psychology: psychologyCriteria.map(c => ({ name: c, completed: 0, total: 0, percentage: 0 })),
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

  // 평가 데이터 가져오기
  useEffect(() => {
    const fetchEvaluationData = async () => {
      if (models.length === 0) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // 윤리 평가
        const ethicsData: any = {};
        for (const model of models) {
          try {
            const response = await fetch(`/api/evaluation/ethics?modelId=${model.id}`);
            if (response.ok) {
              ethicsData[model.id] = await response.json();
            } else {
              ethicsData[model.id] = [];
            }
          } catch (error) {
            console.error(`Error fetching ethics data for model ${model.id}:`, error);
            ethicsData[model.id] = [];
          }
        }
        
        // 심리학적 평가
        const psychologyData: any = {};
        for (const model of models) {
          try {
            const response = await fetch(`/api/evaluation/psychological?modelId=${model.id}`);
            if (response.ok) {
              psychologyData[model.id] = await response.json();
            }
          } catch (error) {
            console.error(`Error fetching psychology data for model ${model.id}:`, error);
          }
        }
        
        // 평가 현황 계산
        const ethicsStatus = ethicsCriteria.map(criterion => {
          const completed = Object.values(ethicsData).filter((modelData: any) => 
            modelData?.some((evalItem: any) => evalItem.category === criterion)
          ).length;
          return { name: criterion, completed, total: models.length, percentage: models.length > 0 ? Math.round((completed / models.length) * 100) : 0 };
        });
        
        const psychologyStatus = psychologyCriteria.map(criterion => {
          const completed = Object.values(psychologyData).length;
          return { name: criterion, completed, total: models.length, percentage: models.length > 0 ? Math.round((completed / models.length) * 100) : 0 };
        });
        
        setEvaluationStatus(prev => ({
          ...prev,
          ethics: ethicsStatus,
          psychology: psychologyStatus,
        }));
        
        // 모델별 점수 계산
        const scores = models.map(model => {
          const modelEthicsData = ethicsData[model.id] || [];
          const ethicsAvg = modelEthicsData.length > 0 
            ? Math.round(modelEthicsData.reduce((a: number, b: any) => a + (b.score || 0), 0) / modelEthicsData.length) 
            : 0;
            
          const psychologyScore = psychologyData[model.id]?.percentage || 0;
          
          return {
            model: model.name,
            ethics: ethicsAvg,
            psychology: psychologyScore,
            deepMetrics: 0 // Deep 메트릭 점수는 아직 구현되지 않음
          };
        });
        setModelScores(scores);
        
        // 메트릭 업데이트
        const completedModels = scores.filter(s => s.ethics > 0 || s.psychology > 0).length;
        const avgEthicsScore = scores.reduce((sum, s) => sum + s.ethics, 0) / scores.length || 0;
        const avgPsychologyScore = scores.reduce((sum, s) => sum + s.psychology, 0) / scores.length || 0;
        const totalCompletionPercentage = Math.round(
          (ethicsStatus.reduce((sum, s) => sum + s.percentage, 0) / (ethicsStatus.length * 100) +
           psychologyStatus.reduce((sum, s) => sum + s.percentage, 0) / (psychologyStatus.length * 100)) * 50
        );
        
        setMetrics([
          { name: '평가 완료 모델', value: `${completedModels}/${models.length}`, change: `+${completedModels}`, trend: 'up' },
          { name: '전체 평가 진행률', value: `${totalCompletionPercentage}%`, change: `+${totalCompletionPercentage}%`, trend: 'up' },
          { name: '평균 윤리 점수', value: `${Math.round(avgEthicsScore)}점`, change: `+${Math.round(avgEthicsScore)}점`, trend: 'up' },
          { name: '평균 심리학 점수', value: `${Math.round(avgPsychologyScore)}점`, change: `+${Math.round(avgPsychologyScore)}점`, trend: 'up' },
        ]);
        
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

  const chartData = {
    labels: ['윤리 점수', '심리학 점수', 'Deep 메트릭 점수', '성능 점수', '안전 점수', '사용성 점수'],
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
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: '모델별 종합 점수 비교' },
    },
    scales: { r: { beginAtZero: true, max: 100, ticks: { display: false } } },
  };

  const CircularMetric = ({ title, value, percentage }: { title: string, value: string, percentage: number }) => {
    const data = {
      datasets: [{ data: [percentage, 100 - percentage], backgroundColor: ['#FFA500', '#f3f4f6'], borderWidth: 0 }],
    };
    const options = { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } } };
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 mb-3">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-bold text-green" style={{ fontSize: '16pt' }}>{percentage}%</span>
          </div>
        </div>
        <h3 className="font-semibold text-green mb-1 text-center" style={{ fontSize: '13pt' }}>{title}</h3>
        <p className="font-bold text-green" style={{ fontSize: '16pt' }}>{value}</p>
      </div>
    );
  };

  interface EvaluationItem { name: string; completed: number; total: number; percentage: number; }

  const ModernEvaluationSection = ({ title, data, icon: Icon }: { title: string, data: EvaluationItem[], icon: React.ElementType }) => {
    const averagePercentage = data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.percentage, 0) / data.length) : 0;
    return (
      <div className="bg-transparent p-8 rounded-2xl transition-all duration-300 border-4 border-orange h-96">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-14 h-14 bg-transparent rounded-xl flex items-center justify-center mr-4 `}>
              <Icon className="w-12 h-12 text-white rounded-full" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4" style={{ fontSize: '22pt' }}>{title}</h3>
              <p className="text-white/80 mb-4" style={{ fontSize: '14pt' }}>진행률 {averagePercentage}%</p>
            </div>
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="35" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="6" fill="transparent" />
              <circle cx="50" cy="50" r="35" stroke="#FFA500" strokeWidth="6" fill="transparent" strokeDasharray={`${averagePercentage * 2.2} 220`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-bold text-white" style={{ fontSize: '14pt' }}>{averagePercentage}%</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${item.percentage >= 75 ? 'bg-green-400' : item.percentage >= 50 ? 'bg-yellow-400' : item.percentage >= 25 ? 'bg-orange-400' : 'bg-red-400'}`}></div>
                <span className="text-white" style={{ fontSize: '12pt' }} title={item.name}>{item.name}</span>
              </div>
              <span className="font-medium text-white/80" style={{ fontSize: '12pt' }}>{item.percentage}%</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-orange/30">
          <div className="flex justify-between text-white/80" style={{ fontSize: '12pt' }}>
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
          <Link href="/" className="inline-flex items-center px-3 py-1.5 font-medium text-gray-700 bg-grey/50 border border-grey/50 roun ded-lg hover:bg-grey" style={{ fontSize: '13pt' }}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
             메인으로
          </Link>
          <h1 className="font-bold text-green ml-4" style={{ fontSize: '20pt' }}>대시보드</h1>
        </div>
      </div>
      
      <main className="py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
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
              <CircularMetric title="평균 종합 점수" value={`${Math.round((parseInt(metrics[2].value.replace('점', '')) + parseInt(metrics[3].value.replace('점', ''))) / 2)}점`} percentage={Math.round((parseInt(metrics[2].value.replace('점', '')) + parseInt(metrics[3].value.replace('점', ''))) / 2)} />
              <CircularMetric title="평균 윤리 점수" value={metrics[2].value} percentage={parseInt(metrics[2].value.replace('점', ''))} />
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
                  {models.slice(0, 5).map((model, index) => {
                    const totalScore = (model.ethicsScore || 0) + (model.psychologyScore || 0) + (model.deepMetricsScore || 0);
                    return (
                      <div key={model.id} className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-orange transition-colors">
                        <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center mr-3" style={{ fontSize: '11pt' }}>
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900" style={{ fontSize: '13pt' }}>{model.name}</div>
                            <div className="text-gray-500" style={{ fontSize: '11pt' }}>{model.provider}</div>
                          </div>
                        </div>
                        <span className="font-bold text-green" style={{ fontSize: '14pt' }}>{totalScore}점</span>
                      </div>
                    );
                  })}
                  {models.length === 0 && <div className="text-center text-gray-500 py-4" style={{ fontSize: '14pt' }}>평가된 모델이 없습니다</div>}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-green" style={{ fontSize: '24pt' }}>평가 현황</h2>
                <div className="text-gray-500" style={{ fontSize: '13pt' }}>실시간 업데이트</div>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <ModernEvaluationSection title="AI 윤리" data={evaluationStatus.ethics} icon={ShieldCheckIcon} />
                <ModernEvaluationSection title="심리학적 접근" data={evaluationStatus.psychology} icon={DocumentTextIcon} />
                <ModernEvaluationSection title="Deep 메트릭" data={evaluationStatus.deepMetrics} icon={CpuChipIcon} />
                <ModernEvaluationSection title="초등교육 품질" data={evaluationStatus.educationalQuality} icon={AcademicCapIcon} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
