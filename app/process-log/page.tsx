'use client';

import { 
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  PlusCircleIcon,
  CogIcon,
  BeakerIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProcessLog() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  const processLogs = [
    // 초기 프레임워크 구축 단계
    {
      id: 1,
      date: '2025-06-10',
      title: '거버넌스 프레임워크 초기 설계',
      description: 'AI 모델 거버넌스의 핵심 원칙과 가이드라인 초안 작성',
      status: 'completed',
      category: '설계',
      icon: CogIcon,
      phase: '1단계: 기반 구축'
    },
    {
      id: 2,
      date: '2025-06-19',
      title: '윤리 평가지표 정의',
      description: '10가지 윤리 평가지표 항목 정의 및 평가 기준 수립',
      status: 'completed',
      category: '평가',
      icon: ShieldCheckIcon,
      phase: '1단계: 기반 구축'
    },
    {
      id: 3,
      date: '2025-06-23',
      title: '심리학 기반 체크리스트 개발',
      description: '발달심리학, 인지심리학, 사회심리학 기반 평가 체계 구축',
      status: 'completed',
      category: '개발',
      icon: UserGroupIcon,
      phase: '1단계: 기반 구축'
    },
    
    // 평가 시스템 고도화 단계
    {
      id: 4,
      date: '2025-06-24',
      title: 'AI 윤리 평가 기준 사용자 중심 전환',
      description: '아동 중심 평가 기준을 일반 사용자 중심으로 전환하여 상용 AI 모델 평가에 최적화',
      status: 'completed',
      category: '개선',
      icon: UserGroupIcon,
      phase: '2단계: 평가 시스템 고도화'
    },
    {
      id: 5,
      date: '2025-06-24',
      title: '시나리오 기반 챗봇 응답평가 시스템 구축',
      description: 'DeepEval 프레임워크 기반 신뢰성 평가 시스템 구축 및 7개 핵심 메트릭 적용',
      status: 'completed',
      category: '개발',
      icon: BeakerIcon,
      phase: '2단계: 평가 시스템 고도화'
    },
    {
      id: 6,
      date: '2025-06-24',
      title: 'DeepEval 메트릭 시스템 확장',
      description: '평가 메트릭을 7개에서 12개로 확장하여 포괄적인 AI 모델 평가 체계 완성',
      status: 'completed',
      category: '확장',
      icon: PlusCircleIcon,
      phase: '2단계: 평가 시스템 고도화'
    },
    {
      id: 7,
      date: '2025-06-24',
      title: '평가 메트릭 카테고리 분류 체계 구축',
      description: '12개 메트릭을 RAG, 안전성, 품질, 대화형 등 4개 카테고리로 체계적 분류',
      status: 'completed',
      category: '최적화',
      icon: AdjustmentsHorizontalIcon,
      phase: '2단계: 평가 시스템 고도화'
    },
    
    // UI/UX 개선 단계
    {
      id: 8,
      date: '2025-06-25',
      title: 'UI/UX 색상 시스템 파스텔 톤 전환',
      description: '사용자 경험 개선을 위해 기존 원색 기반 UI를 부드러운 파스텔 톤으로 전환',
      status: 'completed',
      category: 'UI/UX',
      icon: PaintBrushIcon,
      phase: '3단계: 사용자 경험 개선'
    },
    {
      id: 9,
      date: '2025-06-25',
      title: '카테고리별 통합 색상 시스템 구축',
      description: '메트릭 카테고리별 통일된 색상 적용으로 시각적 일관성 및 사용성 향상',
      status: 'completed',
      category: 'UI/UX',
      icon: PaintBrushIcon,
      phase: '3단계: 사용자 경험 개선'
    },
    {
      id: 10,
      date: '2025-06-25',
      title: '모델 비교 페이지 시나리오 평가 통합',
      description: '시나리오 평가 시스템을 모델 비교 페이지에 통합하여 종합적인 모델 분석 환경 제공',
      status: 'completed',
      category: '통합',
      icon: ChartBarIcon,
      phase: '3단계: 사용자 경험 개선'
    },
    
    // 대시보드 시스템 구축 단계
    {
      id: 11,
      date: '2025-06-26',
      title: '메인 대시보드 실시간 데이터 연동 시스템 구축',
      description: '정적 데이터를 실시간 평가 데이터로 전환하여 동적 대시보드 구현',
      status: 'completed',
      category: '데이터',
      icon: ChartBarIcon,
      phase: '4단계: 통합 대시보드 구축'
    },
    {
      id: 12,
      date: '2025-06-26',
      title: '평가 진행 상황 시각화 시스템 구축',
      description: '윤리, 심리학, 시나리오 평가별 진행률 시각화 및 프로그레스 바 구현',
      status: 'completed',
      category: '시각화',
      icon: ChartBarIcon,
      phase: '4단계: 통합 대시보드 구축'
    },
    {
      id: 13,
      date: '2025-06-26',
      title: '스마트 액션 센터 구축',
      description: '사용자 평가 상태에 따른 맞춤형 다음 단계 제안 시스템 구현',
      status: 'completed',
      category: '자동화',
      icon: CogIcon,
      phase: '4단계: 통합 대시보드 구축'
    },
    {
      id: 14,
      date: '2025-06-26',
      title: '모델별 종합 점수 대시보드 구축',
      description: 'GPT-4, Claude-3, Gemini-2.0 모델별 A-F 등급 시스템 및 강점/약점 분석 구현',
      status: 'completed',
      category: '분석',
      icon: ChartBarIcon,
      phase: '4단계: 통합 대시보드 구축'
    },
    
    // 거버넌스 시스템 완성 단계
    {
      id: 15,
      date: '2025-06-26',
      title: '거버넌스 프레임워크 페이지 인터랙티브 개선',
      description: '정적 카드 레이아웃을 실시간 데이터 기반 동적 대시보드로 전환',
      status: 'completed',
      category: '개선',
      icon: DocumentTextIcon,
      phase: '5단계: 거버넌스 시스템 완성'
    },
    {
      id: 16,
      date: '2025-06-26',
      title: '실시간 통계 및 진행률 시스템 구축',
      description: '활성 모델 수, 완료된 평가, 진행률, 평균 점수 등 실시간 통계 시스템 구현',
      status: 'completed',
      category: '데이터',
      icon: ChartBarIcon,
      phase: '5단계: 거버넌스 시스템 완성'
    },
    {
      id: 17,
      date: '2025-06-26',
      title: '모델 감사 시스템 완전 리뉴얼',
      description: '기존 3개 모델에서 13개 모델로 확장, 검색/필터링 기능 및 카드 기반 UI 구현',
      status: 'completed',
      category: '확장',
      icon: ShieldCheckIcon,
      phase: '5단계: 거버넌스 시스템 완성'
    },
    
    // 실제 평가 데이터 통합 단계
    {
      id: 18,
      date: '2025-07-01',
      title: '종합 평가 결과 데이터 통합',
      description: 'comprehensive_evaluation_results.json에서 안전성 메트릭 3개 (환각 방지, 편향 방지, 독성 방지) 추출 및 모델 비교 페이지 통합',
      status: 'completed',
      category: '데이터',
      icon: ChartBarIcon,
      phase: '6단계: 실제 평가 데이터 통합'
    },
    {
      id: 19,
      date: '2025-07-01',
      title: '품질 메트릭 평가 데이터 통합',
      description: 'quality_metrics_evaluation_results.json에서 품질/안전성 메트릭 3개 (명확성, PII 유출 방지, 전문성) 추출 및 추가',
      status: 'completed',
      category: '데이터',
      icon: ChartBarIcon,
      phase: '6단계: 실제 평가 데이터 통합'
    },
    {
      id: 20,
      date: '2025-07-01',
      title: '일관성 및 정렬 메트릭 통합',
      description: 'coherence_alignment_evaluation_results.json에서 품질 메트릭 2개 (일관성, 프롬프트 정렬) 추출 및 추가',
      status: 'completed',
      category: '데이터',
      icon: ChartBarIcon,
      phase: '6단계: 실제 평가 데이터 통합'
    },
    {
      id: 21,
      date: '2025-07-01',
      title: '대화형 메트릭 평가 데이터 통합',
      description: 'conversational_metrics_evaluation_results.json에서 대화형 메트릭 3개 (역할 준수, 지식 보유, 대화 완성도) 추출 및 추가',
      status: 'completed',
      category: '데이터',
      icon: ChartBarIcon,
      phase: '6단계: 실제 평가 데이터 통합'
    },
    {
      id: 22,
      date: '2025-07-02',
      title: '5단계 성능 레벨링 시스템 구축',
      description: '평가 점수를 5단계 성능 레벨 (우수/양호/보통/개선필요/불량)로 분류하는 색상 코딩 시스템 구현',
      status: 'completed',
      category: '시각화',
      icon: PaintBrushIcon,
      phase: '6단계: 실제 평가 데이터 통합'
    },
    {
      id: 23,
      date: '2025-07-03',
      title: '메트릭 카테고리 순서 최적화',
      description: '사용자 경험 개선을 위해 메트릭 표시 순서를 안전성 → 품질 → 대화형 → RAG 순으로 재정렬',
      status: 'completed',
      category: '최적화',
      icon: AdjustmentsHorizontalIcon,
      phase: '6단계: 실제 평가 데이터 통합'
    },
    {
      id: 24,
      date: '2025-07-03',
      title: '실시간 평가 진행률 시스템 구축',
      description: '11/15 메트릭 완료 상태를 실시간 반영하는 진행률 표시 시스템 및 테스트 케이스 카운팅 구현',
      status: 'completed',
      category: '시각화',
      icon: ChartBarIcon,
      phase: '6단계: 실제 평가 데이터 통합'
    },
    
    // UI/UX 혁신 및 사용자 경험 최적화 단계
    {
      id: 25,
      date: '2025-07-07',
      title: 'AI 윤리지표 시나리오 평가 연계 분석',
      description: 'AI 윤리지표 10개 항목 중 시나리오 기반 평가 가능 항목 분석 및 6개 핵심 항목 식별',
      status: 'completed',
      category: '분석',
      icon: ShieldCheckIcon,
      phase: '7단계: 사용자 인터페이스 혁신'
    },
    {
      id: 26,
      date: '2025-07-07',
      title: '포용성 및 위험관리 항목 시나리오 평가 연결',
      description: '포용성과 위험관리 항목을 시나리오 평가와 연결하여 총 8개 항목으로 확장',
      status: 'completed',
      category: '확장',
      icon: PlusCircleIcon,
      phase: '7단계: 사용자 인터페이스 혁신'
    },
    {
      id: 27,
      date: '2025-07-07',
      title: '메인 페이지 사용성 문제 분석 및 개선방안 도출',
      description: '기존 메뉴 구분의 모호함과 추상적 설명 문제를 분석하고 카테고리별 그룹화 솔루션 설계',
      status: 'completed',
      category: '분석',
      icon: AdjustmentsHorizontalIcon,
      phase: '7단계: 사용자 인터페이스 혁신'
    },
    {
      id: 28,
      date: '2025-07-07',
      title: '카테고리별 메뉴 그룹화 시스템 설계',
      description: '모니터링&분석, 거버넌스&감사 2개 카테고리로 메뉴를 체계적으로 분류하고 새로운 UI 구조 설계',
      status: 'completed',
      category: '설계',
      icon: CogIcon,
      phase: '7단계: 사용자 인터페이스 혁신'
    },
    {
      id: 29,
      date: '2025-07-07',
      title: '사용자 맞춤형 추천 시스템 구축',
      description: '각 메뉴별 주요 기능 명시 및 관리자/개발자 역할별 맞춤 추천 시스템 구현',
      status: 'completed',
      category: '개발',
      icon: UserGroupIcon,
      phase: '7단계: 사용자 인터페이스 혁신'
    },
    {
      id: 30,
      date: '2025-07-07',
      title: '메인 페이지 UI/UX 혁신 완료',
      description: '카테고리별 그룹화 및 사용자 맞춤형 UI로 메인 페이지를 완전히 리뉴얼하여 사용성 대폭 개선',
      status: 'completed',
      category: 'UI/UX',
      icon: PaintBrushIcon,
      phase: '7단계: 사용자 인터페이스 혁신'
    },
    
    // 성능 모니터링 시스템 구축 단계
    {
      id: 31,
      date: '2025-07-08',
      title: 'LM Evaluation Harness 벤치마크 시스템 구축',
      description: '6가지 표준 벤치마크(MMLU, HellaSwag, ARC, TruthfulQA, GSM8K, HumanEval)를 활용한 성능 평가 시스템 구축',
      status: 'completed',
      category: '개발',
      icon: BeakerIcon,
      phase: '8단계: 성능 모니터링 시스템 구축'
    },
    {
      id: 32,
      date: '2025-07-08',
      title: '벤치마크 지원 상태 분석 및 최적화',
      description: '현재 설정에서 지원 가능한 3가지 벤치마크(TruthfulQA, GSM8K, HumanEval) 식별 및 테스트 환경 구축',
      status: 'completed',
      category: '분석',
      icon: AdjustmentsHorizontalIcon,
      phase: '8단계: 성능 모니터링 시스템 구축'
    },
    {
      id: 33,
      date: '2025-07-08',
      title: '모델별 성능 비교 테이블 구현',
      description: '3개 모델(GPT-4, Claude, Gemini)의 벤치마크별 성능 비교 테이블 및 실시간 업데이트 시스템 구현',
      status: 'completed',
      category: '시각화',
      icon: ChartBarIcon,
      phase: '8단계: 성능 모니터링 시스템 구축'
    },
    {
      id: 34,
      date: '2025-07-08',
      title: '성능 알림 시스템 구축',
      description: '벤치마크 테스트 준비 상태 및 지원 불가 항목에 대한 실시간 알림 시스템 구현',
      status: 'completed',
      category: '알림',
      icon: DocumentTextIcon,
      phase: '8단계: 성능 모니터링 시스템 구축'
    },
    
    // 고급 분석 및 통합 시스템 구축 단계
    {
      id: 35,
      date: '2025-07-09',
      title: '스마트 액션 센터 고도화',
      description: '사용자 평가 상태 기반 맞춤형 다음 단계 제안 및 평가 우선순위 지능화 시스템 구현',
      status: 'completed',
      category: '자동화',
      icon: CogIcon,
      phase: '9단계: 고급 분석 및 통합 시스템'
    },
    {
      id: 36,
      date: '2025-07-09',
      title: '모델별 종합 점수 A-F 등급 시스템 완성',
      description: '윤리, 심리학, 시나리오 평가 결과를 통합한 종합 점수 계산 및 A-F 등급 자동 분류 시스템 구현',
      status: 'completed',
      category: '분석',
      icon: ChartBarIcon,
      phase: '9단계: 고급 분석 및 통합 시스템'
    },
    {
      id: 37,
      date: '2025-07-09',
      title: '모델별 강점/약점 자동 분석 시스템',
      description: '평가 결과를 바탕으로 각 모델의 강점과 약점을 자동으로 분석하고 개선 방향 제시하는 시스템 구현',
      status: 'completed',
      category: '분석',
      icon: UserGroupIcon,
      phase: '9단계: 고급 분석 및 통합 시스템'
    },
    {
      id: 38,
      date: '2025-07-09',
      title: '평가 완료 상태 자동 추적 시스템',
      description: '3가지 평가 방법(윤리, 심리학, 시나리오)의 완료 상태를 자동으로 추적하고 진행률 실시간 업데이트',
      status: 'completed',
      category: '자동화',
      icon: ClockIcon,
      phase: '9단계: 고급 분석 및 통합 시스템'
    },
    
    // 진행 중인 작업들
    {
      id: 39,
      date: '2025-07-10',
      title: '모델 비교 분석 프레임워크 고도화',
      description: 'GPT-4-turbo, Claude-3-opus, Gemini-2.0 모델 비교 분석 체계 지속적 개선',
      status: 'in_progress',
      category: '분석',
      icon: BeakerIcon,
      phase: '지속적 개선'
    },
    {
      id: 40,
      date: '2025-07-10',
      title: '과정 기록 시스템 타임라인 구축',
      description: '개발 과정의 체계적 기록 및 시각화를 위한 타임라인 기반 추적 시스템 구현',
      status: 'in_progress',
      category: '문서화',
      icon: DocumentTextIcon,
      phase: '지속적 개선'
    }
  ];

  // 필터링된 로그
  const filteredLogs = processLogs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  // 단계별 그룹화
  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const phase = log.phase;
    if (!groups[phase]) {
      groups[phase] = [];
    }
    groups[phase].push(log);
    return groups;
  }, {} as Record<string, typeof processLogs>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'in_progress':
        return <PlayIcon className="w-5 h-5" />;
      case 'planned':
        return <ClockIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'in_progress':
        return '진행중';
      case 'planned':
        return '예정';
      default:
        return status;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '설계':
        return 'bg-indigo-100 text-indigo-800';
      case '평가':
        return 'bg-green-100 text-green-800';
      case '개발':
        return 'bg-blue-100 text-blue-800';
      case '개선':
        return 'bg-purple-100 text-purple-800';
      case '확장':
        return 'bg-yellow-100 text-yellow-800';
      case '최적화':
        return 'bg-pink-100 text-pink-800';
      case 'UI/UX':
        return 'bg-teal-100 text-teal-800';
      case '통합':
        return 'bg-orange-100 text-orange-800';
      case '데이터':
        return 'bg-cyan-100 text-cyan-800';
      case '시각화':
        return 'bg-emerald-100 text-emerald-800';
      case '자동화':
        return 'bg-violet-100 text-violet-800';
      case '분석':
        return 'bg-red-100 text-red-800';
      case '문서화':
        return 'bg-gray-100 text-gray-800';
      case '알림':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseColor = (phase: string) => {
    if (phase.includes('1단계')) return 'bg-emerald-50 border-emerald-200';
    if (phase.includes('2단계')) return 'bg-blue-50 border-blue-200';
    if (phase.includes('3단계')) return 'bg-purple-50 border-purple-200';
    if (phase.includes('4단계')) return 'bg-orange-50 border-orange-200';
    if (phase.includes('5단계')) return 'bg-rose-50 border-rose-200';
    if (phase.includes('6단계')) return 'bg-cyan-50 border-cyan-200';
    if (phase.includes('7단계')) return 'bg-indigo-50 border-indigo-200';
    if (phase.includes('8단계')) return 'bg-teal-50 border-teal-200';
    if (phase.includes('9단계')) return 'bg-lime-50 border-lime-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getPhaseIconColor = (phase: string) => {
    if (phase.includes('1단계')) return 'bg-emerald-500';
    if (phase.includes('2단계')) return 'bg-blue-500';
    if (phase.includes('3단계')) return 'bg-purple-500';
    if (phase.includes('4단계')) return 'bg-orange-500';
    if (phase.includes('5단계')) return 'bg-rose-500';
    if (phase.includes('6단계')) return 'bg-cyan-500';
    if (phase.includes('7단계')) return 'bg-indigo-500';
    if (phase.includes('8단계')) return 'bg-teal-500';
    if (phase.includes('9단계')) return 'bg-lime-500';
    return 'bg-gray-500';
  };

  // 통계 계산
  const stats = {
    total: processLogs.length,
    completed: processLogs.filter(log => log.status === 'completed').length,
    inProgress: processLogs.filter(log => log.status === 'in_progress').length,
    phases: Object.keys(groupedLogs).length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* 헤더 섹션 */}
      <header className="mb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
        <button 
              onClick={() => router.push('/')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              뒤로 가기
        </button>
            <h1 className="text-3xl font-bold text-gray-900">개발 과정 기록</h1>
      </div>

          {/* 통계 요약 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">총 작업</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.total}개</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">완료</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.completed}개</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PlayIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">진행 중</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.inProgress}개</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {Math.round((stats.completed / stats.total) * 100)}%
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">진행률</dt>
                      <dd className="text-lg font-medium text-gray-900">{Math.round((stats.completed / stats.total) * 100)}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 필터 */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체 ({processLogs.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'completed' 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CheckCircleIcon className="w-4 h-4 inline mr-1" />
              완료 ({stats.completed})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'in_progress' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PlayIcon className="w-4 h-4 inline mr-1" />
              진행 중 ({stats.inProgress})
            </button>
          </div>
        </div>
      </div>

      {/* 타임라인 */}
      <main>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {Object.entries(groupedLogs).map(([phase, logs]) => (
              <div key={phase} className={`border-2 border-dashed rounded-lg p-6 ${getPhaseColor(phase)}`}>
                <div className="flex items-center mb-6">
                  <div className={`flex-shrink-0 w-8 h-8 ${getPhaseIconColor(phase)} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">
                      {phase.includes('지속적 개선') ? '∞' : phase.charAt(0)}
                    </span>
                  </div>
                  <h2 className="ml-3 text-xl font-bold text-gray-900">{phase}</h2>
                  <span className="ml-3 text-sm text-gray-500">({logs.length}개 작업)</span>
                </div>

                <div className="space-y-4">
                  {logs.map((log, index) => {
                    const Icon = log.icon;
                    return (
                      <div key={log.id} className="relative">
                        {/* 연결선 */}
                        {index < logs.length - 1 && (
                          <div className="absolute left-4 top-12 w-0.5 h-6 bg-gray-300"></div>
                        )}
                        
                        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
                          <div className="p-6">
                            <div className="flex items-start space-x-4">
                              {/* 아이콘 */}
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <Icon className="w-5 h-5 text-indigo-600" />
                                </div>
                              </div>

                              {/* 내용 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                      {log.title}
                                    </h3>
                                    <p className="text-gray-600 mb-3">
                                      {log.description}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 ml-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                                      {getStatusIcon(log.status)}
                                      <span className="ml-1">{getStatusText(log.status)}</span>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-sm text-gray-500">
                                  <div className="flex items-center space-x-4">
                                    <span>{log.date}</span>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getCategoryColor(log.category)}`}>
                                      {log.category}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 빈 상태 */}
          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">해당 상태의 작업이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                다른 필터를 선택해보세요.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 