'use client';

import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function AIEthicsEvaluation() {
  const router = useRouter();
  const { t } = useLanguage();

  const evaluationCriteria = [
    {
      id: 1,
      slug: 'accountability',
      name: '책임성',
      description: 'AI 시스템의 모든 결정과 행동에 대한 책임 소재를 명확히 규정하고, 그 과정을 투명하게 설명할 수 있는지를 평가합니다. 문제가 발생했을 때 원인을 추적하고 책임자를 식별할 수 있는 메커니즘을 포함하며, 이는 사용자와 사회의 신뢰를 확보하는 데 필수적입니다.',
    },
    {
      id: 2,
      slug: 'data-privacy',
      name: '데이터 프라이버시',
      description: '사용자의 개인정보를 안전하게 보호하고, 데이터 수집, 처리, 저장의 모든 과정에서 프라이버시 원칙을 준수하는지 평가합니다. 민감한 정보의 유출을 방지하고, 데이터 사용에 대한 투명한 동의 절차를 마련해야 합니다. 사용자의 데이터 주권을 존중하는 것이 핵심입니다.',
    },
    {
      id: 3,
      slug: 'fairness',
      name: '공정성',
      description: 'AI 시스템이 특정 개인이나 집단에 대해 편향된 결과를 도출하거나 차별하지 않는지를 평가합니다. 데이터의 편향성을 최소화하고, 알고리즘의 공정성을 지속적으로 모니터링하여 모든 사용자에게 공평한 기회를 제공해야 합니다. 사회적 다양성을 존중하는 것이 중요합니다.',
    },
    {
      id: 4,
      slug: 'inclusion',
      name: '포용성',
      description: '장애, 연령, 성별, 문화적 배경 등 다양한 특성을 가진 사용자들이 동등하게 접근하고 활용할 수 있도록 설계되었는지 평가합니다. 보편적 설계 원칙을 적용하여 기술적 장벽을 제거하고, 디지털 격차를 해소하는 노력이 포함됩니다.',
    },
    {
      id: 5,
      slug: 'transparency',
      name: '투명성',
      description: 'AI 시스템의 작동 원리, 데이터 사용 방식, 의사결정 과정을 사용자가 이해하기 쉽게 공개하는지를 평가합니다. 시스템의 판단 근거를 명확하게 제시하여, 사용자가 결과를 신뢰하고 예측할 수 있도록 돕는 것이 목표입니다.',
    },
    {
      id: 6,
      slug: 'harm-prevention',
      name: '위해 방지',
      description: 'AI 시스템이 개인, 사회, 환경에 미칠 수 있는 잠재적이고 의도치 않은 피해를 사전에 식별하고 예방하는 능력을 평가합니다. 물리적, 정신적, 경제적 위험을 포함한 모든 부정적 영향을 최소화하기 위한 안전장치가 요구됩니다.',
    },
    {
      id: 7,
      slug: 'safety',
      name: '안전성',
      description: 'AI 시스템이 의도된 대로 안정적으로 작동하며, 외부 공격이나 오작동으로부터 안전한지를 평가합니다. 해킹, 데이터 위변조 등 사이버 위협에 대한 강력한 보안 체계를 갖추고, 시스템의 기술적 결함을 지속적으로 점검해야 합니다.',
    },
    {
      id: 8,
      slug: 'maintenance',
      name: '유지보수성',
      description: '변화하는 기술 환경과 사용자 요구에 맞춰 AI 시스템을 지속적으로 개선하고 업데이트할 수 있는지를 평가합니다. 장기적인 관점에서 시스템의 성능과 안정성을 유지하기 위한 효율적인 관리 및 보수 체계가 필요합니다.',
    },
    {
      id: 9,
      slug: 'risk-management',
      name: '위험 관리',
      description: 'AI 시스템 운영 전반에 걸쳐 발생할 수 있는 잠재적 위험을 체계적으로 식별, 분석, 평가하고 대응하는 체계를 평가합니다. 위험 발생 시 피해를 최소화하고 신속하게 복구할 수 있는 비상 계획을 포함합니다.',
    },
    {
      id: 10,
      slug: 'stability',
      name: '안정성',
      description: '다양한 입력과 조건 하에서도 AI 시스템이 일관되고 예측 가능한 성능을 유지하는지를 평가합니다. 시스템의 강건성(robustness)과 신뢰성을 확보하여, 예기치 않은 상황에서도 안정적인 서비스를 제공할 수 있어야 합니다.',
    },
  ];

  const handleCriterionClick = (slug: string) => {
    router.push(`/governance-framework/evaluations/ai-ethics/${slug}`);
  };

  const handleDeepMetricsEvaluationClick = (slug: string) => {
    router.push(`/governance-framework/evaluations/deep-metrics?focus=${slug}`);
  };

  const deepMetricsEvaluationItems = ['accountability', 'safety', 'fairness', 'data-privacy', 'transparency', 'harm-prevention', 'stability', 'inclusion', 'risk-management', 'maintenance'];

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
          <h1 className="text-[20pt] font-bold text-green ml-4">AI 윤리 평가지표</h1>
        </div>
      </div>

      <main className="py-4 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-4 bg-transparent shadow rounded-lg border border-lime">
          <div className="px-6 py-6">
            <h2 className="text-[20pt] font-semibold text-white mb-4">개요</h2>
            <p className="text-white mb-4">
              AI 윤리 평가는 AI 시스템의 윤리적 측면을 종합적으로 평가하여 안전하고 신뢰할 수 있는 AI 개발을 지원합니다.
            </p>
            <div className="bg-transparent border border-lime rounded-md p-4 mb-4">
              <h3 className="text-lg font-medium text-white mb-2">평가 방법</h3>
              <ul className="text-sm text-white space-y-1">
                <li>• 각 평가 기준별 상세 체크리스트 검토</li>
                <li>• 정량적/정성적 평가 지표 분석</li>
                <li>• Deep 메트릭 기반 실제 사례 테스트</li>
                <li>• 초등교육 전문가 검토 및 피드백 반영</li>
              </ul>
            </div>
            <div className="bg-transparent border border-lime rounded-md p-4">
              <h3 className="text-lg font-medium text-white mb-2">Deep 메트릭 기반 평가</h3>
              <p className="text-sm text-white mb-2">
                실제 사용 맥락과 유사한 시나리오를 통해 AI 시스템의 윤리적 판단과 행동을 평가합니다.
              </p>
              <p className="text-sm text-white">
                Deep 메트릭은 실제 사용 환경을 반영하여 지속적으로 업데이트됩니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-[28pt] font-bold text-white mb-4">평가 기준</h2>
          <p className="text-white mb-4">
            AI 시스템의 윤리적 측면을 평가하기 위한 10가지 핵심 기준입니다.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mt-6">
            {evaluationCriteria.map((criterion) => (
              <div 
                key={criterion.id} 
                className="bg-transparent shadow rounded-lg hover:shadow-md transition-shadow flex flex-col border-2 border-lime"
              >
                <div className="px-8 py-8 flex flex-col flex-grow">
                  <div className="flex-grow">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-transparent text-lime text-sm font-medium rounded-full mr-3 flex-shrink-0 border-2 border-lime">
                        {criterion.id}
                      </span>
                      <h3 className="text-lg font-semibold text-lime">{criterion.name}</h3>
                    </div>
                    <p className="mt-3 text-white text-sm h-32">
                      {criterion.description}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCriterionClick(criterion.slug)}
                      className="inline-flex items-center px-3 py-2 border border-lime text-sm font-medium rounded-md text-lime bg-transparent hover:bg-lime/20 transition-colors"
                    >
                      <ChevronRightIcon className="w-4 h-4 mr-1" />
                      상세 평가
                    </button>
                    {deepMetricsEvaluationItems.includes(criterion.slug) && (
                      <button
                        onClick={() => handleDeepMetricsEvaluationClick(criterion.slug)}
                        className="inline-flex items-center px-3 py-2 border border-lime text-sm font-medium rounded-md text-lime bg-transparent hover:bg-lime/20 transition-colors"
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
