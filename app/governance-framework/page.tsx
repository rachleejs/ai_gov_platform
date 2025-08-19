'use client';

import {
  ArrowLeftIcon,
  CheckCircleIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  PlayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement } from 'chart.js';

ChartJS.register(ArcElement);

export default function GovernanceFramework() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [overallStats, setOverallStats] = useState({
    totalEvaluations: 0,
    completedEvaluations: 0,
    activeModels: 3,
    averageScore: 0
  });

  const [models, setModels] = useState<{ id: string, name: string }[]>([]);
  const ethicsCriteria = ['accountability', 'data-privacy', 'fairness', 'inclusion', 'transparency', 'harm-prevention', 'safety', 'maintenance', 'risk-management', 'stability'];

  const [evaluationFrameworks, setEvaluationFrameworks] = useState([
    {
      id: 'ai-ethics',
      name: 'AI 윤리 평가 (Deep 메트릭 기반)',
      route: '/governance-framework/evaluations/ai-ethics',
      lastUpdated: '2025-07-01',
      status: 'active',
      description: 'DeepEval과 DeepTeam 프레임워크를 활용하여 AI 모델의 윤리적, 기술적 성능을 종합적으로 측정하는 첨단 평가 방법입니다.',
      icon: CheckCircleIcon,
      metrics: ['환각 방지', '독성 방지', '편향 방지', '충실성', '답변 관련성', '문맥 정확성', '일관성', 'PII 유출 방지'],
      totalCriteria: 12,
      completedCriteria: 11,
      completionRate: 92
    },
    {
      id: 'psychology',
      name: '심리학적 평가지표',
      route: '/governance-framework/evaluations/psychological',
      lastUpdated: '2025-06-20',
      status: 'active',
      description: t('governance.psychology.description'),
      icon: DocumentTextIcon,
      metrics: [
        t('governance.psychology.metrics.cognitive'),
        t('governance.psychology.metrics.social'),
        t('governance.psychology.metrics.identity'),
        t('governance.psychology.metrics.learning')
      ],
      totalCriteria: 6,
      completedCriteria: 0,
      completionRate: 0
    },

    {
      id: 'edu-quality',
      name: '초등교육 품질평가',
      route: '/governance-framework/evaluations/educational-quality',
      lastUpdated: '2025-07-01',
      status: 'active',
      description: '초등 교육 도메인에 특화된 AI 모델의 출력 품질을 사실성, 정확성, 구체성 기준으로 평가합니다.',
      icon: ExclamationTriangleIcon,
      metrics: ['사실성 평가', '정확성 평가', '구체성 평가', '교육적 적합성'],
      totalCriteria: 9,
      completedCriteria: 0,
      completionRate: 0
    },
  ]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          setModels(data);
        } else {
          console.error('Failed to fetch models');
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };
    fetchModels();
  }, []);
  
  useEffect(() => {
    const calculateStats = async () => {
      if (models.length === 0 || !user) return;

      let totalCompleted = 0;
      let totalPossible = 0;
      let totalScore = 0;
      let scoreCount = 0;

      // Ethics evaluations
      const ethicsPromises = models.map(model => 
        fetch(`/api/evaluation/ethics?modelId=${model.id}`).then(res => res.json())
      );
      const ethicsResults = await Promise.all(ethicsPromises);

      let ethicsCompletedCount = 0;
      ethicsResults.forEach(result => {
        if (result && result.length > 0) {
          result.forEach((evaluation: any) => {
            ethicsCompletedCount++;
            totalScore += evaluation.score;
            scoreCount++;
          });
        }
      });
      
      const ethicsCompletedCriteria = ethicsResults.flat().filter(r => r).length;

      // Psychological evaluations
      const psychologyPromises = models.map(model =>
        fetch(`/api/evaluation/psychological?modelId=${model.id}`).then(res => res.json())
      );
      const psychologyResults = await Promise.all(psychologyPromises);

      let psychologyCompletedCount = 0;
      psychologyResults.forEach(result => {
        if (result) {
          psychologyCompletedCount++;
          totalScore += result.percentage; // Assuming percentage is on a 0-100 scale
          scoreCount++;
        }
      });

      // Educational Quality evaluations
      const eduQualityResponse = await fetch('/api/evaluation/educational-quality');
      const eduQualityResults = eduQualityResponse.ok ? await eduQualityResponse.json() : [];
      
      let eduQualityCompletedCount = eduQualityResults.length;
      eduQualityResults.forEach((result: any) => {
        totalScore += result.overall_score;
        scoreCount++;
      });

      totalCompleted = ethicsCompletedCriteria + psychologyCompletedCount + eduQualityCompletedCount;
      totalPossible = (ethicsCriteria.length * models.length) + models.length + (9 * models.length); // 9 criteria for edu quality

      setEvaluationFrameworks(prev => prev.map(fw => {
        if (fw.id === 'ai-ethics') {
          return {
            ...fw,
            completedCriteria: ethicsCompletedCriteria,
            completionRate: Math.round((ethicsCompletedCriteria / (ethicsCriteria.length * models.length)) * 100)
          };
        }
        if (fw.id === 'psychology') {
          return {
            ...fw,
            completedCriteria: psychologyCompletedCount,
            completionRate: Math.round((psychologyCompletedCount / models.length) * 100)
          };
        }
        if (fw.id === 'edu-quality') {
          return {
            ...fw,
            completedCriteria: eduQualityCompletedCount,
            completionRate: Math.round((eduQualityCompletedCount / (9 * models.length)) * 100)
          };
        }
        return fw;
      }));

      setOverallStats({
        totalEvaluations: totalPossible,
        completedEvaluations: totalCompleted,
        activeModels: models.length,
        averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0
      });
    };

    if (models.length > 0 && user) {
      calculateStats();
    }
  }, [models, user, t]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { text: '활성', color: 'text-green bg-green/10' };
      case 'development':
        return { text: '개발 중', color: 'text-white bg-tan/50' };
      default:
        return { text: '알 수 없음', color: 'text-gray-500 bg-gray-100' };
    }
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
        <div className="relative w-40 h-40 mb-4">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-green">{percentage}%</span>
          </div>
        </div>
        <h3 className="text-[16pt] font-semibold text-green mb-1 text-center">{title}</h3>
        <p className="text-[18pt] font-bold text-green">{value}</p>
      </div>
    );
  };

  const handleTestDB = () => {
    alert('DB 연결 테스트 완료!');
  };

  return (
    <div className="bg-lime min-h-screen">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <Link
            href="/"
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-grey border border-tan/50 rounded-lg hover:bg-tan"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            메인으로
          </Link>
          <h1 className="text-xl font-bold text-green ml-4">다양한 프레임워크</h1>
        </div>
      </div>

      <main className="py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-8 p-8">
          <div className="text-center mb-8">
            <h2 className="text-[32pt] font-bold text-green mb-2">AI 프레임워크 종합 현황</h2>
            <p className="text-[14pt] text-grey max-w-3xl mx-auto mt-6 tracking-wide">
              포괄적인 평가를 통해 AI 시스템의 윤리적, 기술적 안전성을 검증하고 개선 방향을 제시합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <CircularMetric 
              title="평가 모델" 
              value={overallStats.activeModels.toString()} 
              percentage={overallStats.activeModels > 0 ? Math.round((overallStats.activeModels / 10) * 100) : 0}
            />
            <CircularMetric 
              title="완료된 평가" 
              value={`${overallStats.completedEvaluations}/${overallStats.totalEvaluations}`}
              percentage={overallStats.totalEvaluations > 0 ? Math.round((overallStats.completedEvaluations / overallStats.totalEvaluations) * 100) : 0}
            />
            <CircularMetric 
              title="평가 진행률" 
              value={`${overallStats.totalEvaluations > 0 ? Math.round((overallStats.completedEvaluations / overallStats.totalEvaluations) * 100) : 0}%`}
              percentage={overallStats.totalEvaluations > 0 ? Math.round((overallStats.completedEvaluations / overallStats.totalEvaluations) * 100) : 0}
            />
            <CircularMetric 
              title="평균 점수" 
              value={overallStats.averageScore.toString()}
              percentage={overallStats.averageScore}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-green mb-2">평가 체계</h3>
          <p className="text-green mb-6">AI 거버넌스는 여러 평가 체계로 구성되어 있습니다. 각 체계를 통해 종합적인 분석을 수행할 수 있습니다.</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {evaluationFrameworks.map((framework, index) => {
              const statusInfo = getStatusInfo(framework.status);
              return (
                <li key={index} className="bg-transparent rounded-xl shadow-md hover:shadow-xl transition-all duration-200 border border-orange border-4 min-h-[280px]">
                  <Link
                    href={framework.route}
                    className="w-full text-left p-8 group disabled:opacity-50 disabled:cursor-not-allowed block h-full"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-green-dark/30 text-green mr-4">
                          <framework.icon className="h-10 w-10" />
                        </div>
                        <div>
                          <h4 className="text-[18pt] font-semibold text-green group-hover:text-white">{framework.name}</h4>
                          <p className="text-[14pt] text-grey">최근 업데이트: {framework.lastUpdated}</p>
                        </div>
                      </div>
                      <span className={`text-[12pt] font-semibold px-2.5 py-1 rounded-full ${framework.status === 'active' ? 'bg-white/20 text-green' : 'text-white bg-white'}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <p className="mt-4 text-[14pt] text-grey">{framework.description}</p>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-[14pt] text-grey mb-1">
                        <span>진행률</span>
                        <span>{framework.completionRate}%</span>
                      </div>
                      <div className="w-full bg-green-dark rounded-full h-2">
                        <div
                          className="bg-orange h-2 rounded-full"
                          style={{ width: `${framework.completionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/20">
                      <h5 className="text-[16pt] font-semibold text-grey mb-2">주요 평가지표</h5>
                      <div className="flex flex-wrap gap-2">
                        {framework.metrics.slice(0, 4).map((metric, i) => (
                          <span key={i} className="text-[12pt] text-grey bg-green-dark/30 px-2 py-1 rounded-md">
                            {metric}
                          </span>
                        ))}
                        {framework.metrics.length > 4 && (
                          <span className="text-[12pt] text-white bg-green-dark/30 px-2 py-1 rounded-md">
                            ...
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
}