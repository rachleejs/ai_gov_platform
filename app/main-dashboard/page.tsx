'use client'

import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ShieldCheckIcon, 
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

import { useState, useEffect } from 'react';
import { dashboardService, evaluationService, modelService } from '../../lib/database';
import { useAuth } from '../contexts/AuthContext';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MainDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [metrics, setMetrics] = useState([
    { name: '평가 완료 모델', value: '0/0', change: '+0', trend: 'neutral' },
    { name: '전체 평가 진행률', value: '0%', change: '+0%', trend: 'neutral' },
    { name: '평균 윤리 점수', value: '0점', change: '+0점', trend: 'neutral' },
    { name: '시나리오 평가 평균점수', value: '0점', change: '+0점', trend: 'neutral' },
  ]);

  const models = ['gpt4-turbo', 'claude3-opus', 'gemini2-flash'];
  const ethicsCriteria = ['accountability', 'data-privacy', 'fairness', 'inclusion', 'transparency', 'harm-prevention', 'safety', 'maintenance', 'risk-management', 'stability'];

  useEffect(() => {
    const calculateMetrics = async () => {
      if (!user) return;

      try {
        const stats = await dashboardService.getOverallStats();
        const userEvaluations = await evaluationService.getUserEvaluations(user.id);
        const aiModels = await modelService.getAllModels();
        
        const ethicsEvaluations = userEvaluations.filter(e => e.evaluation_type === 'ethics');
        const dbEthicsScore = ethicsEvaluations.length > 0 
          ? Math.round(ethicsEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / ethicsEvaluations.length)
          : 0;
        
        const psychologyEvaluations = userEvaluations.filter(e => e.evaluation_type === 'psychology');
        const dbPsychologyScore = psychologyEvaluations.length > 0
          ? Math.round(psychologyEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / psychologyEvaluations.length)
          : 0;
        
        const scenarioEvaluations = userEvaluations.filter(e => e.evaluation_type === 'scenario');
        const dbScenarioScore = scenarioEvaluations.length > 0
          ? Math.round(scenarioEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / scenarioEvaluations.length)
          : 67; 
        
        const evaluatedModels = new Set(userEvaluations.map(e => e.model_id));
        const dbCompletedModels = evaluatedModels.size;
        const totalModels = aiModels.length;
        
        const dbEvaluationProgress = totalModels > 0 ? Math.round((dbCompletedModels / totalModels) * 100) : 0;

        let completedModels = 0;
        let totalEthicsScore = 0;
        let totalEthicsCount = 0;
        let totalPsychologyScore = 0;
        let totalPsychologyCount = 0;
        let averageScenarioScore = 67;

        models.forEach(modelKey => {
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

          if (hasEthicsData || hasPsychologyData) {
            completedModels++;
          }
        });

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
            trend: finalEvaluationProgress > 50 ? 'up' : 'neutral',
          },
          {
            name: '평균 윤리 점수',
            value: `${finalEthicsScore}점`,
            change: finalEthicsScore > 0 ? `+${finalEthicsScore}점` : '0점',
            trend: finalEthicsScore > 80 ? 'up' : 'neutral',
          },
          {
            name: '시나리오 평가 평균점수',
            value: `${finalScenarioScore}점`,
            change: finalScenarioScore > 0 ? `+${finalScenarioScore}점` : '0점',
            trend: finalScenarioScore > 75 ? 'up' : 'neutral',
          },
        ]);
      } catch (error) {
        console.error('Dashboard metrics calculation error:', error);
      }
    };

    calculateMetrics();
    const handleStorageChange = () => calculateMetrics();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  interface EvaluationItem {
    name: string;
    completed: number;
    total: number;
    percentage: number;
  }

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
      const ethicsStatus = ethicsCriteria.map(criterion => {
        const completedModels = models.filter(modelKey => {
          return localStorage.getItem(`ethics-${criterion}-${modelKey}`) !== null;
        }).length;
        const completionRate = Math.round((completedModels / models.length) * 100);
        return {
          name: criterion.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          completed: completedModels,
          total: models.length,
          percentage: completionRate
        };
      });

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
          const data = localStorage.getItem(`psychological-evaluation-${modelKey}`);
          return data ? Object.keys(JSON.parse(data)).includes(theory.key) : false;
        }).length;
        const completionRate = Math.round((completedModels / models.length) * 100);
        return {
          name: theory.name,
          completed: completedModels,
          total: models.length,
          percentage: completionRate
        };
      });

      const scenarioMetrics = ['RAG', 'Safety', 'Quality', 'Conversational'];
      const scenarioStatus = scenarioMetrics.map(metric => ({
        name: `${metric} 메트릭`,
        completed: 1, 
        total: 1,
        percentage: 100
      }));

      setEvaluationStatus({ ethics: ethicsStatus, psychology: psychologyStatus, scenario: scenarioStatus });
    };
    calculateEvaluationStatus();
  }, []);
  
  const [modelScores, setModelScores] = useState<any[]>([]);

  useEffect(() => {
    const calculateModelScores = () => {
      const scores = models.map(modelKey => {
        let ethicsScore = 0;
        let ethicsCount = 0;
        ethicsCriteria.forEach(criterion => {
          const savedScores = localStorage.getItem(`ethics-${criterion}-${modelKey}`);
          if (savedScores) {
            const parsedScores = JSON.parse(savedScores);
            ethicsScore += Object.values(parsedScores).reduce((sum: number, s: any) => sum + s, 0);
            ethicsCount++;
          }
        });

        let psychologyScore = 0;
        const psychologyScores = localStorage.getItem(`psychological-evaluation-${modelKey}`);
        if (psychologyScores) {
          const parsedScores = JSON.parse(psychologyScores);
          const scoreValues = Object.values(parsedScores) as number[];
          psychologyScore = scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length;
        }

        return {
          model: modelKey,
          ethics: ethicsCount > 0 ? Math.round(ethicsScore / ethicsCount) : 0,
          psychology: Math.round(psychologyScore),
          scenario: 67,
        };
      });
      setModelScores(scores);
    };
    calculateModelScores();
  }, []);

  const chartData = {
    labels: modelScores.map(m => m.model),
    datasets: [
      {
        label: '윤리 점수',
        data: modelScores.map(m => m.ethics),
        backgroundColor: '#3E5879',
        borderRadius: 4,
      },
      {
        label: '심리학 점수',
        data: modelScores.map(m => m.psychology),
        backgroundColor: '#967E76',
        borderRadius: 4,
      },
      {
        label: '시나리오 점수',
        data: modelScores.map(m => m.scenario),
        backgroundColor: '#D8C4B6',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: '모델별 종합 점수 비교' },
    },
    scales: { y: { beginAtZero: true, max: 100 } },
  };

  const renderTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpIcon className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
    return <span className="w-4 h-4">-</span>;
  };
  
  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-taupe';
  };

  const EvaluationSection = ({ title, data, icon: Icon }: { title: string, data: EvaluationItem[], icon: React.ElementType }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-tan/30">
      <div className="flex items-center mb-4">
        <Icon className="w-6 h-6 text-navy mr-3" />
        <h3 className="text-lg font-semibold text-navy">{title}</h3>
      </div>
      <ul className="space-y-3">
        {data.map((item) => (
          <li key={item.name}>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-taupe">{item.name}</span>
              <span className="font-medium text-slate-blue">{item.percentage}%</span>
            </div>
            <div className="w-full bg-cream rounded-full h-2">
              <div className="bg-slate-blue h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="bg-cream min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-tan/50 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-taupe bg-cream border border-tan/50 rounded-lg hover:bg-tan"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              메인으로
            </button>
            <h1 className="text-xl font-bold text-navy">메인 대시보드</h1>
          </div>
        </div>
      </header>
      
      <main className="py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white p-5 rounded-xl shadow-md border border-tan/30">
              <p className="text-sm text-taupe">{metric.name}</p>
              <p className="text-3xl font-bold text-navy mt-1">{metric.value}</p>
              <div className={`flex items-center text-sm mt-2 ${getTrendColor(metric.trend)}`}>
                {renderTrendIcon(metric.trend)}
                <span className="ml-1">{metric.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-tan/30">
            <h3 className="text-lg font-semibold text-navy mb-4">모델별 종합 점수</h3>
            <div style={{ height: '300px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-tan/30">
            <h3 className="text-lg font-semibold text-navy mb-4">주요 바로가기</h3>
            <ul className="space-y-3">
              {[
                { name: 'AI 윤리 프레임워크', href: '/governance-framework/ai-ethics-evaluation', icon: ShieldCheckIcon },
                { name: '심리학적 안정성 평가', href: '/governance-framework/psychological-evaluation', icon: DocumentTextIcon },
                { name: '모델 비교 분석', href: '/model-comparison', icon: ChartBarIcon },
                { name: '과정 기록', href: '/process-log', icon: DocumentTextIcon },
              ].map((item) => (
                <li key={item.name}>
                  <button 
                    onClick={() => router.push(item.href)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-cream transition-colors group"
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 text-slate-blue mr-3" />
                      <span className="text-sm font-medium text-navy">{item.name}</span>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-taupe group-hover:text-navy" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EvaluationSection title="AI 윤리 평가 현황" data={evaluationStatus.ethics} icon={ShieldCheckIcon} />
          <EvaluationSection title="심리학적 안정성 평가 현황" data={evaluationStatus.psychology} icon={DocumentTextIcon} />
          <EvaluationSection title="시나리오 기반 평가 현황" data={evaluationStatus.scenario} icon={ChartBarIcon} />
        </div>
      </main>
    </div>
  );
} 