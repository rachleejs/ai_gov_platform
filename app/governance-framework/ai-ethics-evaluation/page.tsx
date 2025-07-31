'use client';

import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AIEthicsEvaluation() {
  const router = useRouter();
  const { t } = useLanguage();

  const evaluationCriteria = [
    {
      id: 1,
      slug: 'accountability',
      name: '책임성',
      description: 'AI 시스템의 결정과 행동에 대한 명확한 책임 소재와 설명 가능성을 평가합니다.',
      importance: '책임 소재 파악과 투명한 의사결정 과정의 중요성',
      maxScore: 100,
    },
    {
      id: 2,
      slug: 'data-privacy',
      name: '데이터 프라이버시',
      description: '개인정보 보호 및 데이터 처리의 안전성을 평가합니다.',
      importance: '사용자 데이터 보호와 프라이버시 보장의 중요성',
      maxScore: 100,
    },
    {
      id: 3,
      slug: 'fairness',
      name: '공정성',
      description: 'AI 시스템의 편향성 없는 판단과 차별 방지 능력을 평가합니다.',
      importance: '모든 사용자에 대한 공평한 처우의 중요성',
      maxScore: 100,
    },
    {
      id: 4,
      slug: 'inclusion',
      name: '포용성',
      description: '다양한 사용자 그룹을 고려한 접근성과 사용성을 평가합니다.',
      importance: '모든 사용자의 접근성 보장의 중요성',
      maxScore: 100,
    },
    {
      id: 5,
      slug: 'transparency',
      name: '투명성',
      description: 'AI 시스템의 의사결정 과정과 결과의 명확성을 평가합니다.',
      importance: '시스템 작동 방식의 투명한 공개의 중요성',
      maxScore: 100,
    },
    {
      id: 6,
      slug: 'harm-prevention',
      name: '위해 방지',
      description: 'AI 시스템이 사용자와 사회에 미칠 수 있는 잠재적 위험을 평가합니다.',
      importance: '사용자 안전과 사회적 영향 고려의 중요성',
      maxScore: 100,
    },
    {
      id: 7,
      slug: 'safety',
      name: '안전성',
      description: 'AI 시스템의 기술적 안정성과 보안성을 평가합니다.',
      importance: '시스템 안전성과 보안 유지의 중요성',
      maxScore: 100,
    },
    {
      id: 8,
      slug: 'maintenance',
      name: '유지보수성',
      description: 'AI 시스템의 지속적인 관리와 업데이트 용이성을 평가합니다.',
      importance: '시스템의 지속적인 개선과 관리의 중요성',
      maxScore: 100,
    },
    {
      id: 9,
      slug: 'risk-management',
      name: '위험 관리',
      description: '잠재적 위험 요소의 식별과 대응 체계를 평가합니다.',
      importance: '위험 요소 관리와 대응 체계의 중요성',
      maxScore: 100,
    },
    {
      id: 10,
      slug: 'stability',
      name: '안정성',
      description: 'AI 시스템의 일관된 성능과 신뢰성을 평가합니다.',
      importance: '시스템의 안정적인 운영과 신뢰성의 중요성',
      maxScore: 100,
    },
  ];

  const handleCriterionClick = (slug: string) => {
    router.push(`/governance-framework/ai-ethics-evaluation/${slug}`);
  };

  const handleScenarioEvaluationClick = (slug: string) => {
    router.push(`/governance-framework/scenario-evaluation?focus=${slug}`);
  };

  // 시나리오 기반 평가에서 테스트하는 항목들
  const scenarioEvaluationItems = ['accountability', 'safety', 'fairness', 'data-privacy', 'transparency', 'harm-prevention', 'stability', 'inclusion', 'risk-management', 'maintenance'];

  return (
    <div className="bg-grey">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.push('/governance-framework')}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-grey border border-tan/50 rounded-lg hover:bg-tan"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            거버넌스 프레임워크로 돌아가기
          </button>
          <h1 className="text-xl font-bold text-green ml-4">AI 윤리 평가</h1>
        </div>
      </div>

      <main className="py-4 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 개요 섹션 */}
        <div className="mt-4 bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            <h2 className="text-xl font-semibold text-green mb-4">개요</h2>
            <p className="text-white mb-4">
              AI 윤리 평가는 AI 시스템의 윤리적 측면을 종합적으로 평가하여 안전하고 신뢰할 수 있는 AI 개발을 지원합니다.
            </p>
            <div className="bg-green/10 border border-green/20 rounded-md p-4 mb-4">
              <h3 className="text-lg font-medium text-green mb-2">평가 방법</h3>
              <ul className="text-sm text-white space-y-1">
                <li>• 각 평가 기준별 상세 체크리스트 검토</li>
                <li>• 정량적/정성적 평가 지표 분석</li>
                <li>• 시나리오 기반 실제 사례 테스트</li>
                <li>• 초등교육 전문가 검토 및 피드백 반영</li>
              </ul>
            </div>
            <div className="bg-green/10 border border-green/20 rounded-md p-4">
              <h3 className="text-lg font-medium text-green mb-2">시나리오 기반 평가</h3>
              <p className="text-sm text-white mb-2">
                실제 사용 시나리오를 통해 AI 시스템의 윤리적 판단과 행동을 평가합니다.
              </p>
              <p className="text-xs text-white">
                💡 시나리오는 실제 사용 환경을 반영하여 지속적으로 업데이트됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 평가 기준 목록 */}
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-bold text-green">평가 기준</h2>
          <p className="text-white mb-4">
            AI 시스템의 윤리적 측면을 평가하기 위한 10가지 핵심 기준입니다.
          </p>
          {evaluationCriteria.map((criterion) => (
            <div 
              key={criterion.id} 
              className="bg-white shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-green/20 text-green text-sm font-medium rounded-full mr-3">
                        {criterion.id}
                      </span>
                      <h3 className="text-lg font-semibold text-green">{criterion.name}</h3>
                    </div>
                    <p className="mt-3 text-white">{criterion.description}</p>
                    
                    {/* 액션 버튼들 */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleCriterionClick(criterion.slug)}
                        className="inline-flex items-center px-3 py-2 border border-green/30 text-sm font-medium rounded-md text-green bg-green/10 hover:bg-green/20 transition-colors"
                      >
                        <ChevronRightIcon className="w-4 h-4 mr-1" />
                        상세 평가
                      </button>
                      {scenarioEvaluationItems.includes(criterion.slug) && (
                        <button
                          onClick={() => handleScenarioEvaluationClick(criterion.slug)}
                          className="inline-flex items-center px-3 py-2 border border-green/30 text-sm font-medium rounded-md text-green bg-green/10 hover:bg-green/20 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          Deep 메트릭 평가
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 평가 진행 안내 */}
        <div className="mt-8 bg-green/10 border border-green/20 rounded-lg">
          <div className="px-6 py-6">
            <h2 className="text-xl font-semibold text-green mb-4">평가 진행 방법</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-green/20 text-green text-sm font-medium rounded-full">
                    1
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-green">평가 기준 선택</h3>
                  <p className="text-white">위의 10개 평가 기준 중 하나를 클릭하여 상세 페이지로 이동합니다.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-green/20 text-green text-sm font-medium rounded-full">
                    2
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-green">모델 선택 및 평가</h3>
                  <p className="text-white">평가할 AI 모델을 선택하고 해당 기준에 따라 평가를 진행합니다.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-green/20 text-green text-sm font-medium rounded-full">
                    3
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-green">결과 확인</h3>
                  <p className="text-white">평가 결과는 모델 비교 분석 페이지에서 확인할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 