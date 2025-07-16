'use client';

import { 
  ArrowLeftIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function RiskAudit() {
  const router = useRouter();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const allAudits = [
    // 주요 평가 모델들
    {
      id: 1,
      name: 'GPT-4-turbo',
      provider: 'OpenAI',
      version: 'gpt-4-turbo-2024-04-09',
      date: '2025-06-26',
      status: 'in_progress',
      findings: '윤리 평가 진행 중',
      risk: 'medium',
      category: 'LLM',
      modelType: '범용 대화 모델',
      ethicsScore: 85,
      lastUpdate: '2시간 전'
    },
    {
      id: 2,
      name: 'Claude-3-opus',
      provider: 'Anthropic',
      version: 'claude-3-opus-20240229',
      date: '2025-06-25',
      status: 'in_progress',
      findings: '심리학 평가 단계',
      risk: 'low',
      category: 'LLM',
      modelType: '범용 대화 모델',
      ethicsScore: 92,
      lastUpdate: '1일 전'
    },
    {
      id: 3,
      name: 'Gemini-2.0-flash',
      provider: 'Google',
      version: 'gemini-2.0-flash-exp',
      date: '2025-06-24',
      status: 'in_progress',
      findings: '심리학 평가 단계',
      risk: 'low',
      category: 'LLM',
      modelType: '범용 대화 모델',
      ethicsScore: 78,
      lastUpdate: '3시간 전'
    },
    // 추가 모델들
    {
      id: 4,
      name: 'GPT-3.5-turbo',
      provider: 'OpenAI',
      version: 'gpt-3.5-turbo-0125',
      date: '2025-06-20',
      status: 'scheduled',
      findings: '감사 예정',
      risk: 'unknown',
      category: 'LLM',
      modelType: '범용 대화 모델',
      ethicsScore: null,
      lastUpdate: '예정'
    },
    {
      id: 5,
      name: 'Claude-3-sonnet',
      provider: 'Anthropic',
      version: 'claude-3-sonnet-20240229',
      date: '2025-06-18',
      status: 'scheduled',
      findings: '감사 예정',
      risk: 'unknown',
      category: 'LLM',
      modelType: '범용 대화 모델',
      ethicsScore: null,
      lastUpdate: '예정'
    },
    {
      id: 6,
      name: 'Claude-3-haiku',
      provider: 'Anthropic',
      version: 'claude-3-haiku-20240307',
      date: '2025-06-15',
      status: 'scheduled',
      findings: '감사 예정',
      risk: 'unknown',
      category: 'LLM',
      modelType: '효율성 최적화 모델',
      ethicsScore: null,
      lastUpdate: '예정'
    },
    {
      id: 7,
      name: 'Llama-3-70b',
      provider: 'Meta',
      version: 'llama-3-70b-instruct',
      date: '2025-06-12',
      status: 'scheduled',
      findings: '감사 예정',
      risk: 'unknown',
      category: 'LLM',
      modelType: '오픈소스 추론 모델',
      ethicsScore: null,
      lastUpdate: '예정'
    },
    {
      id: 8,
      name: 'Llama-3-8b',
      provider: 'Meta',
      version: 'llama-3-8b-instruct',
      date: '2025-06-10',
      status: 'scheduled',
      findings: '감사 예정',
      risk: 'unknown',
      category: 'LLM',
      modelType: '경량 추론 모델',
      ethicsScore: null,
      lastUpdate: '예정'
    },
    {
      id: 9,
      name: 'PaLM-2',
      provider: 'Google',
      version: 'palm-2-chat-bison',
      date: '2025-06-08',
      status: 'scheduled',
      findings: '감사 예정',
      risk: 'unknown',
      category: 'LLM',
      modelType: '범용 대화 모델',
      ethicsScore: null,
      lastUpdate: '예정'
    },
    {
      id: 10,
      name: 'Cohere Command',
      provider: 'Cohere',
      version: 'command-r-plus',
      date: '2025-06-05',
      status: 'scheduled',
      findings: '감사 예정',
      risk: 'unknown',
      category: 'LLM',
      modelType: '기업용 대화 모델',
      ethicsScore: null,
      lastUpdate: '예정'
    }
  ];

  // 필터링된 감사 목록
  const filteredAudits = allAudits.filter(audit => {
    const matchesSearch = audit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || audit.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || audit.risk === riskFilter;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  // 통계 계산
  const auditWithScores = allAudits.filter(a => a.ethicsScore !== null);
  const stats = {
    total: allAudits.length,
    completed: allAudits.filter(a => a.status === 'completed').length,
    inProgress: allAudits.filter(a => a.status === 'in_progress').length,
    scheduled: allAudits.filter(a => a.status === 'scheduled').length,
    highRisk: allAudits.filter(a => a.risk === 'high').length,
    averageScore: auditWithScores.length > 0 ? Math.round(auditWithScores.reduce((sum, a) => sum + (a.ethicsScore || 0), 0) / auditWithScores.length) : 0
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'in_progress':
        return <ClockIcon className="w-4 h-4" />;
      case 'scheduled':
        return <DocumentTextIcon className="w-4 h-4" />;
      default:
        return <ShieldCheckIcon className="w-4 h-4" />;
    }
  };

  const getRiskIcon = (risk: string) => {
    if (risk === 'high') {
      return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
    return <ShieldCheckIcon className="w-4 h-4" />;
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
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
              {t('audit.back')}
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{t('audit.mainTitle')}</h1>
          </div>

          {/* 통계 요약 카드 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">총 모델</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
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
                      <dd className="text-lg font-medium text-gray-900">{stats.completed}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">진행 중</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.inProgress}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">예정</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.scheduled}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">고위험</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.highRisk}</dd>
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
                      {stats.averageScore}
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">평균 점수</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.averageScore}/100</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 검색 및 필터 */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="모델명 또는 제공업체 검색..."
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
          >
                <option value="all">모든 상태</option>
                <option value="completed">완료</option>
                <option value="in_progress">진행 중</option>
                <option value="scheduled">예정</option>
          </select>
            </div>

            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-gray-400 mr-2" />
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <option value="all">모든 위험도</option>
                <option value="high">높음</option>
                <option value="medium">중간</option>
                <option value="low">낮음</option>
                <option value="unknown">미정</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 모델 카드 그리드 */}
      <main>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAudits.map((audit) => (
              <div
                key={audit.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200"
              >
                <div className="p-6">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {audit.name}
                      </h3>
                      <p className="text-sm text-gray-600">{audit.provider}</p>
                      <p className="text-xs text-gray-500 mt-1">{audit.version}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(audit.status)}`}>
                        {getStatusIcon(audit.status)}
                        <span className="ml-1">
                          {audit.status === 'completed' ? '완료' : 
                           audit.status === 'in_progress' ? '진행중' : 
                           audit.status === 'scheduled' ? '예정' : '미정'}
                        </span>
              </span>
            </div>
                  </div>

                  {/* 정보 섹션 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">모델 종류</span>
                      <span className="text-sm font-medium text-gray-900">{audit.modelType}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">시작일</span>
                      <span className="text-sm font-medium text-gray-900">{audit.date}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">마지막 업데이트</span>
                      <span className="text-sm font-medium text-gray-900">{audit.lastUpdate}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">윤리 점수</span>
                      <span className={`text-sm font-bold ${getScoreColor(audit.ethicsScore)}`}>
                        {audit.ethicsScore ? `${audit.ethicsScore}/100` : '미측정'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">위험도</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(audit.risk)}`}>
                        {getRiskIcon(audit.risk)}
                        <span className="ml-1">
                          {audit.risk === 'high' ? '높음' : 
                           audit.risk === 'medium' ? '중간' : 
                           audit.risk === 'low' ? '낮음' : '미정'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* 발견사항 */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">발견사항</p>
                    <p className="text-sm text-gray-900">{audit.findings}</p>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="mt-6 flex space-x-3">
                    <button className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                      상세 보기
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors">
                      보고서
                    </button>
                  </div>
                </div>
          </div>
        ))}
      </div>

          {/* 빈 상태 */}
          {filteredAudits.length === 0 && (
            <div className="text-center py-12">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">검색 결과가 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                다른 검색어나 필터를 시도해보세요.
              </p>
        </div>
          )}
        </div>
      </main>
    </div>
  );
} 