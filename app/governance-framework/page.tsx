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

export default function GovernanceFramework() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [overallStats, setOverallStats] = useState({
    totalEvaluations: 0,
    completedEvaluations: 0,
    activeModels: 3,
    averageScore: 0
  });

  const models = ['gpt4-turbo', 'claude3-opus', 'gemini2-flash'];
  const ethicsCriteria = ['accountability', 'data-privacy', 'fairness', 'inclusion', 'transparency', 'harm-prevention', 'safety', 'maintenance', 'risk-management', 'stability'];

  const evaluationFrameworks = [
    {
      id: 'ai-ethics',
      name: t('governance.aiEthics.name'),
      route: '/governance-framework/ai-ethics-evaluation',
      lastUpdated: '2025-07-01',
      status: 'active',
      description: t('governance.aiEthics.description'),
      icon: CheckCircleIcon,
      metrics: [
        t('accountability.title'),
        t('dataPrivacy.title'),
        t('fairness.title'),
        t('inclusion.title'),
        t('transparency.title')
      ],
      totalCriteria: 10,
      completedCriteria: 0,
      completionRate: 0
    },
    {
      id: 'psychology',
      name: t('governance.psychology.name'),
      route: '/governance-framework/psychological-evaluation',
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
      id: 'scenario',
      name: '시나리오 기반 평가',
      route: '/governance-framework/scenario-evaluation',
      lastUpdated: '2025-07-01',
      status: 'active',
      description: '실제 사용 상황에서의 AI 성능과 안전성을 평가합니다.',
      icon: ChartBarIcon,
      metrics: ['RAG 메트릭', '안전성 메트릭', '품질 메트릭', '대화형 메트릭'],
      totalCriteria: 12,
      completedCriteria: 11,
      completionRate: 92
    },
    {
      id: 'expert',
      name: '전문가 자문',
      route: '#',
      lastUpdated: '2025-06-23',
      status: 'development',
      description: '분야별 전문가의 정성적 평가와 권고사항을 제공합니다.',
      icon: ExclamationTriangleIcon,
      metrics: ['전문가 패널', '정성 평가', '자문 의견', '권고사항'],
      totalCriteria: 4,
      completedCriteria: 0,
      completionRate: 0
    },
  ];

  useEffect(() => {
    const calculateStats = () => {
      let totalCompleted = 0;
      let totalPossible = 0;
      let totalScore = 0;
      let scoreCount = 0;

      let ethicsCompletedCriteria = 0;
      ethicsCriteria.forEach(criterion => {
        models.forEach(modelKey => {
          const savedScores = localStorage.getItem(`ethics-${criterion}-${modelKey}`);
          if (savedScores) {
            ethicsCompletedCriteria++;
            const scores = JSON.parse(savedScores);
            const score = Object.values(scores).reduce((sum: number, s: any) => sum + s, 0);
            totalScore += score;
            scoreCount++;
          }
        });
      });

      let psychologyCompletedTheories = 0;
      models.forEach(modelKey => {
        const savedScores = localStorage.getItem(`psychological-evaluation-${modelKey}`);
        if (savedScores) {
          psychologyCompletedTheories++;
          const scores = JSON.parse(savedScores);
          const scoreValues = Object.values(scores) as number[];
          const avgScore = scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length;
          totalScore += avgScore * 20;
          scoreCount++;
        }
      });

      totalCompleted = ethicsCompletedCriteria + psychologyCompletedTheories;
      totalPossible = (ethicsCriteria.length * models.length) + models.length;

      evaluationFrameworks[0].completedCriteria = ethicsCompletedCriteria;
      evaluationFrameworks[0].completionRate = Math.round((ethicsCompletedCriteria / (ethicsCriteria.length * models.length)) * 100);

      evaluationFrameworks[1].completedCriteria = psychologyCompletedTheories;
      evaluationFrameworks[1].completionRate = Math.round((psychologyCompletedTheories / (6 * models.length)) * 100);

      evaluationFrameworks[2].completedCriteria = 11;
      evaluationFrameworks[2].completionRate = Math.round((11 / 12) * 100);

      evaluationFrameworks[3].completedCriteria = 0;
      evaluationFrameworks[3].completionRate = 0;

      setOverallStats({
        totalEvaluations: totalPossible,
        completedEvaluations: totalCompleted,
        activeModels: models.length,
        averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0
      });
    };

    calculateStats();
    
    const handleStorageChange = () => calculateStats();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  const handleTestDB = () => {
    alert('DB 연결 테스트 완료!');
  };

  return (
    <div className="bg-grey min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-tan/50 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Link
              href="/"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-grey border border-tan/50 rounded-lg hover:bg-tan"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              메인으로
            </Link>
            <h1 className="text-xl font-bold text-green">다양한 프레임워크</h1>
          </div>
        </div>
      </header>
      <main className="py-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-8 bg-white rounded-2xl shadow-lg border border-tan/30 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-green mb-2">AI 프레임워크 종합 현황</h2>
              <p className="text-white max-w-3xl mx-auto">
                포괄적인 평가를 통해 AI 시스템의 윤리적, 기술적 안전성을 검증하고 개선 방향을 제시합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-grey rounded-lg p-5 text-center shadow-sm border border-tan/50">
                <div className="text-3xl font-bold text-green">{overallStats.activeModels}</div>
                <div className="text-sm text-white mt-1">평가 모델</div>
              </div>
              <div className="bg-grey rounded-lg p-5 text-center shadow-sm border border-tan/50">
                <div className="text-3xl font-bold text-green">
                  {overallStats.completedEvaluations}/{overallStats.totalEvaluations}
                </div>
                <div className="text-sm text-white mt-1">완료된 평가</div>
              </div>
              <div className="bg-grey rounded-lg p-5 text-center shadow-sm border border-tan/50">
                <div className="text-3xl font-bold text-green">
                  {overallStats.totalEvaluations > 0 ? Math.round((overallStats.completedEvaluations / overallStats.totalEvaluations) * 100) : 0}%
                </div>
                <div className="text-sm text-white mt-1">평가 진행률</div>
              </div>
              <div className="bg-grey rounded-lg p-5 text-center shadow-sm border-tan/50">
                <div className="text-3xl font-bold text-green">{overallStats.averageScore}</div>
                <div className="text-sm text-white mt-1">평균 점수</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-green mb-4">추천 다음 단계</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/governance-framework/ai-ethics-evaluation"
                className="group bg-green text-white p-6 rounded-lg hover:bg-green hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center">
                  <PlayIcon className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">윤리 평가 시작</div>
                    <div className="text-green/50 text-sm group-hover:text-white">10개 핵심 기준 평가</div>
                  </div>
                </div>
              </Link>
              
              <Link
                href="/model-comparison"
                className="group bg-green text-white p-6 rounded-lg hover:bg-green hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center">
                  <ChartBarIcon className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">모델 비교 분석</div>
                    <div className="text-green/50 text-sm group-hover:text-white">다양한 모델 성능 비교</div>
                  </div>
                </div>
              </Link>

              <Link
                href="/process-log"
                className="group bg-green text-white p-6 rounded-lg hover:bg-green hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">과정 기록 확인</div>
                    <div className="text-green/50 text-sm group-hover:text-white">평가 및 의사결정 추적</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-green mb-2">평가 체계</h3>
            <p className="text-white mb-6">AI 거버넌스는 여러 평가 체계로 구성되어 있습니다. 각 체계를 통해 종합적인 분석을 수행할 수 있습니다.</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {evaluationFrameworks.map((framework, index) => {
                const statusInfo = getStatusInfo(framework.status);
                return (
                  <li key={index} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 border border-tan/30">
                    <Link
                      href={framework.route}
                      className="w-full text-left p-6 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-green text-white mr-4">
                            <framework.icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-green group-hover:text-green">{framework.name}</h4>
                            <p className="text-sm text-white">최근 업데이트: {framework.lastUpdated}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                      <p className="mt-4 text-sm text-white">{framework.description}</p>
                      
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-white mb-1">
                          <span>진행률</span>
                          <span>{framework.completionRate}%</span>
                        </div>
                        <div className="w-full bg-grey rounded-full h-2">
                          <div
                            className="bg-green h-2 rounded-full"
                            style={{ width: `${framework.completionRate}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-tan/50">
                        <h5 className="text-sm font-semibold text-green mb-2">주요 평가지표</h5>
                        <div className="flex flex-wrap gap-2">
                          {framework.metrics.slice(0, 4).map((metric, i) => (
                            <span key={i} className="text-xs text-white bg-grey px-2 py-1 rounded-md">
                              {metric}
                            </span>
                          ))}
                          {framework.metrics.length > 4 && (
                            <span className="text-xs text-white bg-grey px-2 py-1 rounded-md">
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
        </div>
      </main>
    </div>
  );
}