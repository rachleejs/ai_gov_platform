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

export default function GovernanceFramework() {
  const router = useRouter();
  const { t } = useLanguage();
  
  // 평가 현황 데이터
  const [overallStats, setOverallStats] = useState({
    totalEvaluations: 0,
    completedEvaluations: 0,
    activeModels: 3,
    averageScore: 0
  });

  const models = ['gpt4-turbo', 'claude3-opus', 'gemini2-flash'];
  const ethicsCriteria = ['accountability', 'data-privacy', 'fairness', 'inclusion', 'transparency', 'harm-prevention', 'safety', 'maintenance', 'risk-management', 'stability'];

  // 평가 체계별 상세 정보
  const evaluationFrameworks = [
    {
      id: 'ai-ethics',
      name: t('governance.aiEthics.name'),
      route: '/governance-framework/ai-ethics-evaluation',
      lastUpdated: '2025-07-01',
      status: 'active',
      description: t('governance.aiEthics.description'),
      icon: CheckCircleIcon,
      color: 'emerald',
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
      color: 'indigo',
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
      color: 'blue',
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
      color: 'orange',
      metrics: ['전문가 패널', '정성 평가', '자문 의견', '권고사항'],
      totalCriteria: 4,
      completedCriteria: 0,
      completionRate: 0
    },
  ];

  // 데이터 로드 및 통계 계산
  useEffect(() => {
    const calculateStats = () => {
      let totalCompleted = 0;
      let totalPossible = 0;
      let totalScore = 0;
      let scoreCount = 0;

      // 윤리 평가 현황 - 완료된 기준의 개수
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

      // 심리학 평가 현황 - 완료된 이론의 개수
      let psychologyCompletedTheories = 0;
      models.forEach(modelKey => {
        const savedScores = localStorage.getItem(`psychological-evaluation-${modelKey}`);
        if (savedScores) {
          psychologyCompletedTheories++;
          const scores = JSON.parse(savedScores);
          const scoreValues = Object.values(scores) as number[];
          const avgScore = scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length;
          totalScore += avgScore * 20; // 정규화
          scoreCount++;
        }
      });

      totalCompleted = ethicsCompletedCriteria + psychologyCompletedTheories;
      totalPossible = (ethicsCriteria.length * models.length) + models.length; // 윤리 + 심리학

      // 프레임워크별 완료율 업데이트
      // AI 윤리 평가: 완료된 기준 개수
      evaluationFrameworks[0].completedCriteria = ethicsCompletedCriteria;
      evaluationFrameworks[0].completionRate = Math.round((ethicsCompletedCriteria / (ethicsCriteria.length * models.length)) * 100);

      // 심리학적 평가: 완료된 이론 개수 
      evaluationFrameworks[1].completedCriteria = psychologyCompletedTheories;
      evaluationFrameworks[1].completionRate = Math.round((psychologyCompletedTheories / (6 * models.length)) * 100);

      // 시나리오 기반 평가: 메트릭 완료 개수 (현재는 임시)
      evaluationFrameworks[2].completedCriteria = 11; // 현재 11개 메트릭 완료
      evaluationFrameworks[2].completionRate = Math.round((11 / 12) * 100);

      // 전문가 자문: 단계별 진행
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
              메인으로 돌아가기
            </button>
            <h1 className="text-3xl font-bold leading-tight text-gray-900">AI 거버넌스 프레임워크</h1>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* 히어로 섹션 & 전체 통계 */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 거버넌스 프레임워크</h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                포괄적인 AI 거버넌스 평가를 통해 AI 시스템의 윤리적, 기술적 안전성을 검증하고 개선 방향을 제시합니다.
          </p>
        </div>

            {/* 전체 통계 카드 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{overallStats.activeModels}</div>
                <div className="text-sm text-gray-600">평가 모델</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-emerald-600">
                  {overallStats.completedEvaluations}/{overallStats.totalEvaluations}
                </div>
                <div className="text-sm text-gray-600">완료된 평가</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-purple-600">
                  {overallStats.totalEvaluations > 0 ? Math.round((overallStats.completedEvaluations / overallStats.totalEvaluations) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">평가 진행률</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-orange-600">{overallStats.averageScore}</div>
                <div className="text-sm text-gray-600">평균 점수</div>
              </div>
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">추천 다음 단계</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/governance-framework/ai-ethics-evaluation')}
                className="group bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center">
                  <PlayIcon className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">윤리 평가 시작</div>
                    <div className="text-emerald-100 text-sm">10개 핵심 기준 평가</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => router.push('/model-comparison')}
                className="group bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center">
                  <ChartBarIcon className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">모델 비교 분석</div>
                    <div className="text-purple-100 text-sm">종합 성과 비교</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => router.push('/main-dashboard')}
                className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">메인 대시보드</div>
                    <div className="text-blue-100 text-sm">전체 현황 보기</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 평가 체계 카드 */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">평가 체계</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {evaluationFrameworks.map((framework) => {
                const IconComponent = framework.icon;
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'active': return 'bg-green-100 text-green-800';
                    case 'development': return 'bg-orange-100 text-orange-800';
                    default: return 'bg-yellow-100 text-yellow-800';
                  }
                };
                
                const getStatusText = (status: string) => {
                  switch (status) {
                    case 'active': return '활성';
                    case 'development': return '개발중';
                    default: return '검토중';
                  }
                };

                const getColorClasses = (color: string) => {
                  switch (color) {
                    case 'emerald': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
                    case 'indigo': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
                    case 'blue': return 'text-blue-600 bg-blue-50 border-blue-200';
                    case 'orange': return 'text-orange-600 bg-orange-50 border-orange-200';
                    default: return 'text-gray-600 bg-gray-50 border-gray-200';
                  }
                };

                return (
                  <div
                    key={framework.id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow duration-200"
                  >
                    <div className="p-6">
                      {/* 헤더 */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${getColorClasses(framework.color)} mr-3`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{framework.name}</h4>
                            <p className="text-sm text-gray-500">최종 업데이트: {framework.lastUpdated}</p>
                          </div>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(framework.status)}`}>
                          {getStatusText(framework.status)}
                        </span>
                      </div>

                      {/* 설명 */}
                      <p className="text-gray-600 mb-4">{framework.description}</p>

                      {/* 진행률 */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">진행 상황</span>
                          <span className="text-sm font-bold text-gray-900">{framework.completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              framework.color === 'emerald' ? 'bg-emerald-500' :
                              framework.color === 'indigo' ? 'bg-indigo-500' :
                              framework.color === 'blue' ? 'bg-blue-500' :
                              framework.color === 'orange' ? 'bg-orange-500' : 'bg-gray-500'
                            }`}
                            style={{ width: `${Math.max(framework.completionRate, 5)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{framework.completedCriteria}/{framework.totalCriteria} 항목 완료</p>
                      </div>

                      {/* 주요 메트릭 */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">주요 평가 영역</p>
                        <div className="flex flex-wrap gap-2">
                          {framework.metrics.slice(0, 4).map((metric, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {metric}
                            </span>
                          ))}
                          {framework.metrics.length > 4 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{framework.metrics.length - 4}개 더
                            </span>
                          )}
                        </div>
                      </div>
        </div>
        
                    {/* 액션 버튼 */}
                    <div className="bg-gray-50 px-6 py-4">
                      <button
                        onClick={() => {
                          if (framework.route === '#') {
                            alert('해당 기능은 개발 중입니다.');
                          } else {
                            router.push(framework.route);
                          }
                        }}
                        className={`w-full font-medium py-2 px-4 rounded-md transition-colors ${
                          framework.status === 'active' 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                        disabled={framework.status !== 'active'}
                      >
                        {framework.status === 'active' ? '평가 시작하기' : '개발 중'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}