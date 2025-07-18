'use client';

import { 
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  CogIcon,
  BeakerIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProcessLog() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  const processLogs = [
    { id: 1, date: '2025-06-10', title: '거버넌스 프레임워크 초기 설계', description: 'AI 모델 거버넌스의 핵심 원칙과 가이드라인 초안 작성', status: 'completed', category: '설계', phase: '1단계: 기반 구축' },
    { id: 2, date: '2025-06-19', title: '윤리 평가지표 정의', description: '10가지 윤리 평가지표 항목 정의 및 평가 기준 수립', status: 'completed', category: '평가', phase: '1단계: 기반 구축' },
    { id: 3, date: '2025-06-23', title: '심리학 기반 체크리스트 개발', description: '발달심리학, 인지심리학, 사회심리학 기반 평가 체계 구축', status: 'completed', category: '개발', phase: '1단계: 기반 구축' },
    { id: 4, date: '2025-06-24', title: 'AI 윤리 평가 기준 사용자 중심 전환', description: '아동 중심 평가 기준을 일반 사용자 중심으로 전환하여 상용 AI 모델 평가에 최적화', status: 'completed', category: '개선', phase: '2단계: 평가 시스템 고도화' },
    { id: 5, date: '2025-06-24', title: '시나리오 기반 챗봇 응답평가 시스템 구축', description: 'DeepEval 프레임워크 기반 신뢰성 평가 시스템 구축 및 7개 핵심 메트릭 적용', status: 'completed', category: '개발', phase: '2단계: 평가 시스템 고도화' },
    { id: 6, date: '2025-06-24', title: 'DeepEval 메트릭 시스템 확장', description: '평가 메트릭을 7개에서 12개로 확장하여 포괄적인 AI 모델 평가 체계 완성', status: 'completed', category: '확장', phase: '2단계: 평가 시스템 고도화' },
    { id: 7, date: '2025-06-24', title: '평가 메트릭 카테고리 분류 체계 구축', description: '12개 메트릭을 RAG, 안전성, 품질, 대화형 등 4개 카테고리로 체계적 분류', status: 'completed', category: '최적화', phase: '2단계: 평가 시스템 고도화' },
    { id: 8, date: '2025-06-25', title: 'UI/UX 색상 시스템 파스텔 톤 전환', description: '사용자 경험 개선을 위해 기존 원색 기반 UI를 부드러운 파스텔 톤으로 전환', status: 'completed', category: 'UI/UX', phase: '3단계: 사용자 경험 개선' },
    { id: 9, date: '2025-06-25', title: '카테고리별 통합 색상 시스템 구축', description: '메트릭 카테고리별 통일된 색상 적용으로 시각적 일관성 및 사용성 향상', status: 'completed', category: 'UI/UX', phase: '3단계: 사용자 경험 개선' },
    { id: 10, date: '2025-06-25', title: '모델 비교 페이지 시나리오 평가 통합', description: '시나리오 평가 시스템을 모델 비교 페이지에 통합하여 종합적인 모델 분석 환경 제공', status: 'completed', category: '통합', phase: '3단계: 사용자 경험 개선' },
    { id: 11, date: '2025-06-26', title: '메인 대시보드 실시간 데이터 연동 시스템 구축', description: '정적 데이터를 실시간 평가 데이터로 전환하여 동적 대시보드 구현', status: 'completed', category: '데이터', phase: '4단계: 통합 대시보드 구축' },
    { id: 12, date: '2025-06-26', title: '평가 진행 상황 시각화 시스템 구축', description: '윤리, 심리학, 시나리오 평가별 진행률 시각화 및 프로그레스 바 구현', status: 'completed', category: '시각화', phase: '4단계: 통합 대시보드 구축' },
    { id: 13, date: '2025-06-26', title: '스마트 액션 센터 구축', description: '사용자 평가 상태에 따른 맞춤형 다음 단계 제안 시스템 구현', status: 'completed', category: '자동화', phase: '4단계: 통합 대시보드 구축' },
    { id: 14, date: '2025-06-26', title: '모델별 종합 점수 대시보드 구축', description: 'GPT-4, Claude-3, Gemini-2.0 모델별 A-F 등급 시스템 및 강점/약점 분석 구현', status: 'completed', category: '분석', phase: '4단계: 통합 대시보드 구축' },
    { id: 15, date: '2025-06-26', title: '거버넌스 프레임워크 페이지 인터랙티브 개선', description: '정적 카드 레이아웃을 실시간 데이터 기반 동적 대시보드로 전환', status: 'completed', category: '개선', phase: '5단계: 거버넌스 시스템 완성' },
    { id: 16, date: '2025-06-26', title: '실시간 통계 및 진행률 시스템 구축', description: '활성 모델 수, 완료된 평가, 진행률, 평균 점수 등 실시간 통계 시스템 구현', status: 'completed', category: '데이터', phase: '5단계: 거버넌스 시스템 완성' },
    { id: 17, date: '2025-06-26', title: '모델 감사 시스템 완전 리뉴얼', description: '기존 3개 모델에서 13개 모델로 확장, 검색/필터링 기능 및 카드 기반 UI 구현', status: 'completed', category: '확장', phase: '5단계: 거버넌스 시스템 완성' },
    { id: 18, date: '2025-07-01', title: '종합 평가 결과 데이터 통합', description: 'comprehensive_evaluation_results.json에서 안전성 메트릭 3개 (환각 방지, 편향 방지, 독성 방지) 추출 및 모델 비교 페이지 통합', status: 'completed', category: '데이터', phase: '6단계: 실제 평가 데이터 통합' },
    { id: 19, date: '2025-07-01', title: '품질 메트릭 평가 데이터 통합', description: 'quality_metrics_evaluation_results.json에서 품질/안전성 메트릭 3개 (명확성, PII 유출 방지, 전문성) 추출 및 추가', status: 'completed', category: '데이터', phase: '6단계: 실제 평가 데이터 통합' },
    { id: 20, date: '2025-07-01', title: '일관성 및 정렬 메트릭 통합', description: 'coherence_alignment_evaluation_results.json에서 품질 메트릭 2개 (일관성, 프롬프트 정렬) 추출 및 추가', status: 'completed', category: '데이터', phase: '6단계: 실제 평가 데이터 통합' },
    { id: 21, date: '2025-07-01', title: '대화형 메트릭 평가 데이터 통합', description: 'conversational_metrics_evaluation_results.json에서 대화형 메트릭 3개 (역할 준수, 지식 보유, 대화 완성도) 추출 및 추가', status: 'completed', category: '데이터', phase: '6단계: 실제 평가 데이터 통합' },
    { id: 22, date: '2025-07-02', title: '5단계 성능 레벨링 시스템 구축', description: '모델 비교 페이지에 DeepEval의 5단계 레벨링 시스템(우수, 양호, 보통, 개선필요, 취약) 적용', status: 'completed', category: 'UI/UX', phase: '6단계: 실제 평가 데이터 통합' },
    { id: 23, date: '2025-07-02', title: '시나리오 평가 하위 탭 기능 구현', description: 'DeepEval 신뢰성 평가와 DeepTeam 보안 평가를 선택하여 볼 수 있는 하위 탭 기능 구현', status: 'in_progress', category: '개발', phase: '6단계: 실제 평가 데이터 통합' },
    { id: 24, date: '2025-07-02', title: '전문가 정성 평가 시스템 설계', description: '전문가 정성 평가 시스템의 데이터 구조 및 UI/UX 설계', status: 'scheduled', category: '설계', phase: '7단계: 전문가 평가 시스템 구축' },
    { id: 25, date: '2025-07-03', title: '전문가 정성 평가 UI 개발', description: '전문가 정성 평가 시스템의 UI 개발 및 기능 구현', status: 'scheduled', category: '개발', phase: '7단계: 전문가 평가 시스템 구축' },
    { id: 26, date: '2025-07-04', title: '데이터베이스 스키마 확장', description: '사용자별 평가 기록, AI 모델, 평가지표, 과정 기록 등 종합적인 데이터 저장을 위한 DB 스키마 설계 및 구축', status: 'completed', category: '데이터', phase: '8단계: 데이터베이스 시스템 구축' },
    { id: 27, date: '2025-07-05', title: 'API 엔드포인트 구축', description: 'Supabase 연동을 위한 CRUD API 엔드포인트 구축 (모델, 평가지표, 평가 결과 등)', status: 'completed', category: '개발', phase: '8단계: 데이터베이스 시스템 구축' },
    { id: 28, date: '2025-07-05', title: '커스텀 모델 및 평가지표 추가 기능 구현', description: '사용자가 직접 모델과 평가지표를 추가할 수 있는 기능 및 UI 구현', status: 'completed', category: '개발', phase: '8단계: 데이터베이스 시스템 구축' },
    { id: 29, date: '2025-07-08', title: 'UI 디자인 시스템 리뉴얼', description: '새로운 5가지 색상 팔레트 기반의 디자인 시스템을 모든 페이지에 일관되게 적용하여 사용자 경험 개선', status: 'completed', category: 'UI/UX', phase: '9단계: 최종 리뉴얼' },
  ];

  const filteredLogs = processLogs
    .filter(log => filter === 'all' || log.category === filter)
    .sort((a, b) => b.id - a.id);

  const categories = ['all', ...Array.from(new Set(processLogs.map(log => log.category)))];
  const phases = [...new Set(processLogs.map(log => log.phase))].sort((a,b) => parseInt(b) - parseInt(a));

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ElementType } = {
      '설계': CogIcon, '평가': ShieldCheckIcon, '개발': BeakerIcon, '개선': AdjustmentsHorizontalIcon,
      '확장': PlusCircleIcon, '최적화': CogIcon, 'UI/UX': PaintBrushIcon, '통합': DocumentTextIcon,
      '데이터': ChartBarIcon, '자동화': CogIcon, '분석': ChartBarIcon, '보안': ShieldCheckIcon,
    };
    return iconMap[category] || DocumentTextIcon;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed': return { text: '완료', color: 'bg-slate-blue/10 text-slate-blue', icon: CheckCircleIcon };
      case 'in_progress': return { text: '진행 중', color: 'bg-blue-100 text-blue-800', icon: ClockIcon };
      case 'scheduled': return { text: '예정', color: 'bg-tan/50 text-taupe', icon: ClockIcon };
      default: return { text: status, color: 'bg-gray-100 text-gray-800', icon: ClockIcon };
    }
  };

  return (
    <div className="bg-cream min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-tan/50 sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-taupe bg-cream border border-tan/50 rounded-lg hover:bg-tan"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              메인으로
            </button>
            <h1 className="text-xl font-bold text-navy">과정 기록</h1>
          </div>
        </div>
      </header>

      <main className="py-8 mx-auto max-w-4xl sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-navy mb-2">개발 및 평가 과정 기록</h2>
          <p className="text-taupe max-w-3xl mx-auto">
            AI 거버넌스 플랫폼의 주요 개발 및 평가 활동에 대한 전체 기록을 추적합니다.
          </p>
        </div>

        <div className="mb-8 p-2 bg-white rounded-xl shadow-lg border border-tan/30 flex flex-wrap justify-center gap-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors 
                ${filter === cat ? 'bg-navy text-white shadow' : 'text-taupe hover:bg-cream'}`}
            >
              {cat === 'all' ? '전체 보기' : cat}
            </button>
          ))}
      </div>

        <div className="relative">
          <div className="absolute left-9 top-0 h-full w-0.5 bg-tan/50" aria-hidden="true" />
          {phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="mb-12">
                <div className="flex items-center mb-6">
                <div className="z-10 flex items-center justify-center w-18 h-18 bg-navy rounded-full p-1">
                  <span className="flex items-center justify-center w-16 h-16 bg-cream text-navy font-bold text-lg rounded-full">{phaseIndex + 1}단계</span>
                </div>
                <h3 className="ml-4 text-xl font-bold text-navy">{phase.substring(phase.indexOf(':') + 2)}</h3>
                              </div>

              <div className="space-y-6">
                {filteredLogs.filter(log => log.phase === phase).map(log => {
                  const Icon = getCategoryIcon(log.category);
                  const statusInfo = getStatusInfo(log.status);
                  return (
                    <div key={log.id} className="pl-28 relative">
                      <div className="absolute left-[34px] top-7 w-5 h-5 bg-navy rounded-full border-4 border-cream" />
                      <div className="bg-white p-6 rounded-xl shadow-md border border-tan/30">
                                <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <Icon className="w-6 h-6 text-slate-blue mr-4" />
                            <div>
                              <h4 className="font-semibold text-navy">{log.title}</h4>
                              <p className="text-sm text-taupe">{log.date}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <statusInfo.icon className="w-3 h-3 mr-1.5" />
                            {statusInfo.text}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-taupe pl-10">{log.description}</p>
                        <div className="mt-4 pt-4 border-t border-tan/50 pl-10">
                          <span className="text-xs bg-cream text-taupe px-2 py-1 rounded-md">{log.category}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
} 