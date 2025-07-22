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
} from '@heroicons/react/24/outline';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Assuming these services exist and are correctly implemented
// import { dashboardService, evaluationService, modelService } from '../../lib/database';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MainDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [metrics, setMetrics] = useState([
    { name: '평가 완료 모델', value: '8/10', change: '+2', trend: 'up' },
    { name: '전체 평가 진행률', value: '80%', change: '+20%', trend: 'up' },
    { name: '평균 윤리 점수', value: '88점', change: '+3점', trend: 'up' },
    { name: '시나리오 평가 평균점수', value: '92점', change: '-1점', trend: 'down' },
  ]);

  const models = ['gpt4-turbo', 'claude3-opus', 'gemini2-flash'];
  const ethicsCriteria = ['accountability', 'data-privacy', 'fairness', 'inclusion', 'transparency', 'harm-prevention', 'safety', 'maintenance', 'risk-management', 'stability'];

  // This is mocked data since the services are not available in this context.
  // In a real application, you would fetch this data.
  const mockEvaluationStatus = {
    ethics: ethicsCriteria.map(c => ({ name: c, completed: Math.floor(Math.random() * 4), total: 3, percentage: Math.floor(Math.random() * 101) })),
    psychology: [
        { name: '피아제 인지발달이론', completed: 3, total: 3, percentage: 100 },
        { name: '비고츠키 사회문화이론', completed: 2, total: 3, percentage: 67 },
    ],
    scenario: [
        { name: 'RAG 메트릭', completed: 1, total: 1, percentage: 100 },
        { name: 'Safety 메트릭', completed: 1, total: 1, percentage: 100 },
    ]
  };

  const [evaluationStatus, setEvaluationStatus] = useState(mockEvaluationStatus);
  const [modelScores, setModelScores] = useState([
    { model: 'GPT-4 Turbo', ethics: 92, psychology: 85, scenario: 95 },
    { model: 'Claude 3 Opus', ethics: 90, psychology: 88, scenario: 91 },
    { model: 'Gemini Pro', ethics: 88, psychology: 91, scenario: 89 },
  ]);


  const chartData = {
    labels: modelScores.map(m => m.model),
    datasets: [
      {
        label: '윤리 점수',
        data: modelScores.map(m => m.ethics),
        backgroundColor: '#00473B', // green
        borderRadius: 4,
      },
      {
        label: '심리학 점수',
        data: modelScores.map(m => m.psychology),
        backgroundColor: '#006A58', // middle green
        borderRadius: 4,
      },
      {
        label: '시나리오 점수',
        data: modelScores.map(m => m.scenario),
        backgroundColor: '#008771', // lighter green
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
    if (trend === 'up') return <ArrowUpIcon className="w-4 h-4 text-green" />;
    if (trend === 'down') return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
    return <span className="w-4 h-4">-</span>;
  };
  
  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-green';
    if (trend === 'down') return 'text-red-500';
    return 'text-gray-600';
  };

  interface EvaluationItem {
    name: string;
    completed: number;
    total: number;
    percentage: number;
  }

  const EvaluationSection = ({ title, data, icon: Icon }: { title: string, data: EvaluationItem[], icon: React.ElementType }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-grey/30">
      <div className="flex items-center mb-4">
        <Icon className="w-6 h-6 text-green mr-3" />
        <h3 className="text-lg font-semibold text-green">{title}</h3>
      </div>
      <ul className="space-y-3">
        {data.map((item) => (
          <li key={item.name}>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-600">{item.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              <span className="font-medium text-green">{item.percentage}%</span>
            </div>
            <div className="w-full bg-grey/20 rounded-full h-2">
              <div className="bg-green h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
  
  return (
    <div className="bg-grey/20 min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-grey/50 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-4">
            <Link
              href="/"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-grey/50 border border-grey/50 rounded-lg hover:bg-grey"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
               메인으로
            </Link>
            <h1 className="text-xl font-bold text-green">리더보드</h1>
            <div />
           </div>
         </div>
       </header>
      
      <main className="py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white p-5 rounded-xl shadow-md border border-grey/30">
              <p className="text-sm text-gray-600">{metric.name}</p>
              <p className="text-3xl font-bold text-green mt-1">{metric.value}</p>
              <div className={`flex items-center text-sm mt-2 ${getTrendColor(metric.trend)}`}>
                {renderTrendIcon(metric.trend)}
                <span className="ml-1">{metric.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-grey/30">
            <h3 className="text-lg font-semibold text-green mb-4">모델별 종합 점수</h3>
            <div style={{ height: '300px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-grey/30">
            <h3 className="text-lg font-semibold text-green mb-4">주요 바로가기</h3>
            <ul className="space-y-3">
              {[
                { name: 'AI 윤리 프레임워크', href: '/governance-framework/ai-ethics-evaluation', icon: ShieldCheckIcon },
                { name: '심리학적 안정성 평가', href: '/governance-framework/psychological-evaluation', icon: DocumentTextIcon },
                { name: '모델 비교 분석', href: '/model-comparison', icon: ChartBarIcon },
                { name: '과정 기록', href: '/process-log', icon: DocumentTextIcon },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-grey/20 transition-colors group"
                  >
                     <div className="flex items-center">
                      <item.icon className="w-5 h-5 text-green mr-3" />
                       <span className="text-sm font-medium text-green">{item.name}</span>
                     </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-500 group-hover:text-green" />
                  </Link>
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