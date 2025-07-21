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
    { id: 1, name: 'GPT-4-turbo', provider: 'OpenAI', version: 'gpt-4-turbo-2024-04-09', date: '2025-06-26', status: 'in_progress', findings: '윤리 평가 진행 중', risk: 'medium', category: 'LLM', modelType: '범용 대화 모델', ethicsScore: 85, lastUpdate: '2시간 전' },
    { id: 2, name: 'Claude-3-opus', provider: 'Anthropic', version: 'claude-3-opus-20240229', date: '2025-06-25', status: 'in_progress', findings: '심리학 평가 단계', risk: 'low', category: 'LLM', modelType: '범용 대화 모델', ethicsScore: 92, lastUpdate: '1일 전' },
    { id: 3, name: 'Gemini-2.0-flash', provider: 'Google', version: 'gemini-2.0-flash-exp', date: '2025-06-24', status: 'in_progress', findings: '심리학 평가 단계', risk: 'low', category: 'LLM', modelType: '범용 대화 모델', ethicsScore: 78, lastUpdate: '3시간 전' },
    { id: 4, name: 'GPT-3.5-turbo', provider: 'OpenAI', version: 'gpt-3.5-turbo-0125', date: '2025-06-20', status: 'scheduled', findings: '감사 예정', risk: 'unknown', category: 'LLM', modelType: '범용 대화 모델', ethicsScore: null, lastUpdate: '예정' },
    { id: 5, name: 'Claude-3-sonnet', provider: 'Anthropic', version: 'claude-3-sonnet-20240229', date: '2025-06-18', status: 'scheduled', findings: '감사 예정', risk: 'unknown', category: 'LLM', modelType: '범용 대화 모델', ethicsScore: null, lastUpdate: '예정' },
    { id: 6, name: 'Claude-3-haiku', provider: 'Anthropic', version: 'claude-3-haiku-20240307', date: '2025-06-15', status: 'scheduled', findings: '감사 예정', risk: 'unknown', category: 'LLM', modelType: '효율성 최적화 모델', ethicsScore: null, lastUpdate: '예정' },
    { id: 7, name: 'Llama-3-70b', provider: 'Meta', version: 'llama-3-70b-instruct', date: '2025-06-12', status: 'scheduled', findings: '감사 예정', risk: 'unknown', category: 'LLM', modelType: '오픈소스 추론 모델', ethicsScore: null, lastUpdate: '예정' },
    { id: 8, name: 'Llama-3-8b', provider: 'Meta', version: 'llama-3-8b-instruct', date: '2025-06-10', status: 'scheduled', findings: '감사 예정', risk: 'unknown', category: 'LLM', modelType: '경량 추론 모델', ethicsScore: null, lastUpdate: '예정' },
    { id: 9, name: 'PaLM-2', provider: 'Google', version: 'palm-2-chat-bison', date: '2025-06-08', status: 'scheduled', findings: '감사 예정', risk: 'unknown', category: 'LLM', modelType: '범용 대화 모델', ethicsScore: null, lastUpdate: '예정' },
    { id: 10, name: 'Cohere Command', provider: 'Cohere', version: 'command-r-plus', date: '2025-06-05', status: 'scheduled', findings: '감사 예정', risk: 'unknown', category: 'LLM', modelType: '기업용 대화 모델', ethicsScore: null, lastUpdate: '예정' }
  ];

  const filteredAudits = allAudits.filter(audit => {
    const matchesSearch = audit.name.toLowerCase().includes(searchTerm.toLowerCase()) || audit.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || audit.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || audit.risk === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const auditWithScores = allAudits.filter(a => a.ethicsScore !== null);
  const stats = {
    total: allAudits.length,
    completed: allAudits.filter(a => a.status === 'completed').length,
    inProgress: allAudits.filter(a => a.status === 'in_progress').length,
    scheduled: allAudits.filter(a => a.status === 'scheduled').length,
    highRisk: allAudits.filter(a => a.risk === 'high').length,
    averageScore: auditWithScores.length > 0 ? Math.round(auditWithScores.reduce((sum, a) => sum + (a.ethicsScore || 0), 0) / auditWithScores.length) : 0
  };

  const getRiskInfo = (risk: string) => {
    switch (risk) {
      case 'high': return { text: '높음', color: 'bg-red-100 text-red-800', icon: <ExclamationTriangleIcon className="w-4 h-4" /> };
      case 'medium': return { text: '중간', color: 'bg-yellow-100 text-yellow-800', icon: <ExclamationTriangleIcon className="w-4 h-4" /> };
      case 'low': return { text: '낮음', color: 'bg-green-100 text-green-800', icon: <ShieldCheckIcon className="w-4 h-4" /> };
      default: return { text: '알 수 없음', color: 'bg-gray-100 text-gray-800', icon: <ShieldCheckIcon className="w-4 h-4" /> };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed': return { text: '완료', color: 'bg-slate-blue/10 text-slate-blue', icon: <CheckCircleIcon className="w-4 h-4" /> };
      case 'in_progress': return { text: '진행 중', color: 'bg-blue-100 text-blue-800', icon: <ClockIcon className="w-4 h-4" /> };
      case 'scheduled': return { text: '예정', color: 'bg-tan/50 text-taupe', icon: <DocumentTextIcon className="w-4 h-4" /> };
      default: return { text: '알 수 없음', color: 'bg-gray-100 text-gray-800', icon: <ShieldCheckIcon className="w-4 h-4" /> };
    }
  };

  return (
    <div className="bg-grey min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-tan/50 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-taupe bg-grey border border-tan/50 rounded-lg hover:bg-tan"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              메인으로
            </button>
            <h1 className="text-xl font-bold text-green">위험 감사</h1>
          </div>
        </div>
      </header>

      <main className="py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-green mb-2">AI 모델 위험 감사 현황</h2>
          <p className="text-taupe max-w-3xl mx-auto">
            등록된 AI 모델의 잠재적 위험 요소를 체계적으로 감사하고 관리합니다.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-md border border-tan/30 text-center"><p className="text-sm text-taupe">총 감사</p><p className="text-3xl font-bold text-green mt-1">{stats.total}</p></div>
          <div className="bg-white p-5 rounded-xl shadow-md border border-tan/30 text-center"><p className="text-sm text-taupe">진행 중</p><p className="text-3xl font-bold text-green mt-1">{stats.inProgress}</p></div>
          <div className="bg-white p-5 rounded-xl shadow-md border border-tan/30 text-center"><p className="text-sm text-taupe">예정</p><p className="text-3xl font-bold text-green mt-1">{stats.scheduled}</p></div>
          <div className="bg-white p-5 rounded-xl shadow-md border border-tan/30 text-center"><p className="text-sm text-taupe">고위험</p><p className="text-3xl font-bold text-red-500 mt-1">{stats.highRisk}</p></div>
          <div className="bg-white p-5 rounded-xl shadow-md border border-tan/30 text-center"><p className="text-sm text-taupe">평균 점수</p><p className="text-3xl font-bold text-green mt-1">{stats.averageScore}</p></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-tan/30 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
              <input
                type="text"
                placeholder="모델 또는 제공사 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-grey border border-tan/50 rounded-lg focus:ring-slate-blue focus:border-slate-blue text-green placeholder-taupe"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-grey border border-tan/50 rounded-lg focus:ring-slate-blue focus:border-slate-blue text-green"
              >
                <option value="all">모든 상태</option>
                <option value="completed">완료</option>
                <option value="in_progress">진행 중</option>
                <option value="scheduled">예정</option>
              </select>
            </div>
            <div>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full px-4 py-2 bg-grey border border-tan/50 rounded-lg focus:ring-slate-blue focus:border-slate-blue text-green"
              >
                <option value="all">모든 위험도</option>
                <option value="high">높음</option>
                <option value="medium">중간</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-tan/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-taupe">
              <thead className="text-xs text-green uppercase bg-grey">
                <tr>
                  <th scope="col" className="px-6 py-3">모델명</th>
                  <th scope="col" className="px-6 py-3">상태</th>
                  <th scope="col" className="px-6 py-3">위험도</th>
                  <th scope="col" className="px-6 py-3">윤리 점수</th>
                  <th scope="col" className="px-6 py-3">최근 업데이트</th>
                  <th scope="col" className="px-6 py-3"><span className="sr-only">상세</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredAudits.map((audit) => {
                  const statusInfo = getStatusInfo(audit.status);
                  const riskInfo = getRiskInfo(audit.risk);
                  return (
                    <tr key={audit.id} className="bg-white border-b border-tan/50 hover:bg-grey/50">
                      <th scope="row" className="px-6 py-4 font-medium text-green whitespace-nowrap">
                        <div className="font-semibold">{audit.name}</div>
                        <div className="text-xs text-taupe">{audit.provider} - {audit.version}</div>
                      </th>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.icon}
                          <span className="ml-1.5">{statusInfo.text}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskInfo.color}`}>
                          {riskInfo.icon}
                          <span className="ml-1.5">{riskInfo.text}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-blue">{audit.ethicsScore || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">{audit.lastUpdate}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="font-medium text-slate-blue hover:text-green">상세 보기</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 