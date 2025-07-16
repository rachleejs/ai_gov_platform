'use client';

import React from 'react';
import { ArrowLeftIcon, ChartBarIcon, CheckCircleIcon, ClockIcon, CurrencyDollarIcon, ServerIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// 평가 결과 인터페이스
interface EvaluationResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  completedQuestions: number;
  totalQuestions: number;
}

export default function ModelComparison() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('ethics');
  const [activeScenarioTab, setActiveScenarioTab] = useState<'deepeval' | 'deepteam'>('deepeval');
  const [psychologicalResults, setPsychologicalResults] = useState<{[key: string]: EvaluationResult}>({});

  // 로컬 스토리지에서 심리학 평가 결과 로드
  useEffect(() => {
    const loadPsychologicalResults = () => {
      if (typeof window === 'undefined') return;
      const results: {[key: string]: EvaluationResult} = {};
      
      models.forEach(model => {
        const modelKey = getModelKey(model.name);
        const savedScores = localStorage.getItem(`psychological-evaluation-${modelKey}`);
        
        if (savedScores) {
          const scores = JSON.parse(savedScores);
          const scoreValues = Object.values(scores) as number[];
          const totalScore = scoreValues.reduce((sum, score) => sum + score, 0);
          const completedQuestions = scoreValues.length;
          const totalQuestions = 72; // 총 질문 수 (체크리스트 기반)
          const maxScore = totalQuestions * 5;
          const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
          
          // 등급 계산
          let grade = 'F';
          if (percentage >= 90) grade = 'A+';
          else if (percentage >= 80) grade = 'A';
          else if (percentage >= 70) grade = 'B+';
          else if (percentage >= 60) grade = 'B';
          else if (percentage >= 50) grade = 'C';
          else if (percentage >= 40) grade = 'D';
          
          results[modelKey] = {
            totalScore,
            maxScore,
            percentage,
            grade,
            completedQuestions,
            totalQuestions
          };
        }
      });
      
      setPsychologicalResults(results);
    };

    loadPsychologicalResults();
    
    // 스토리지 변경 감지
    const handleStorageChange = () => {
      loadPsychologicalResults();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 모델명을 키로 변환
  const getModelKey = (modelName: string) => {
    const keyMap: {[key: string]: string} = {
      'GPT-4-turbo': 'gpt4-turbo',
      'Claude-3-opus': 'claude3-opus',
      'Gemini-2.0-flash': 'gemini2-flash'
    };
    return keyMap[modelName] || modelName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  };

  const models = [
    {
      name: 'GPT-4-turbo',
      provider: 'OpenAI',
      accuracy: '98%',
      latency: '120ms',
      cost: '0.03$/1K tokens',
      status: 'active',
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      icon: ServerIcon,
    },
    {
      name: 'Claude-3-opus',
      provider: 'Anthropic',
      accuracy: '97%',
      latency: '150ms',
      cost: '0.025$/1K tokens',
      status: 'active',
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      icon: ServerIcon,
    },
    {
      name: 'Gemini-2.0-flash',
      provider: 'Google',
      accuracy: '96%',
      latency: '100ms',
      cost: '0.02$/1K tokens',
      status: 'testing',
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      icon: ServerIcon,
    },
  ];

  const tabs = [
    { 
      id: 'ethics', 
      name: '윤리 평가',
      icon: '🎯',
      gradient: 'from-emerald-500 to-teal-600'
    },
    { 
      id: 'psychology', 
      name: '심리 평가',
      icon: '🧠',
      gradient: 'from-indigo-500 to-purple-600'
    },
    { 
      id: 'scenario', 
      name: '시나리오 평가',
      icon: '💬',
      gradient: 'from-blue-500 to-cyan-600'
    },
    { 
      id: 'expert', 
      name: '전문가 평가',
      icon: '👨‍💼',
      gradient: 'from-orange-500 to-red-600'
    },
  ];

  // 윤리 평가 결과 로드
  const getEthicsScore = (modelKey: string, criterion: string) => {
    if (typeof window === 'undefined') return '평가 없음';
    
    const savedScores = localStorage.getItem(`ethics-${criterion}-${modelKey}`);
    if (savedScores) {
      const scores = JSON.parse(savedScores);
      const totalScore = Object.values(scores).reduce((sum: number, score: any) => sum + score, 0);
      return `${totalScore}점`;
    }
    return '평가 없음';
  };

  const evaluationMetrics = {
    ethics: [
      { 
        name: '책임성 (Accountability)', 
        'gpt4-turbo': getEthicsScore('gpt4-turbo', 'accountability'), 
        'claude3-opus': getEthicsScore('claude3-opus', 'accountability'), 
        'gemini2-flash': getEthicsScore('gemini2-flash', 'accountability') 
      },
      { name: '데이터/개인정보보호', 'gpt4-turbo': '평가 예정', 'claude3-opus': '평가 예정', 'gemini2-flash': '평가 예정' },
      { name: '공정성 (Fairness)', 'gpt4-turbo': '평가 예정', 'claude3-opus': '평가 예정', 'gemini2-flash': '평가 예정' },
      { name: '포용성 (Inclusion)', 'gpt4-turbo': '평가 예정', 'claude3-opus': '평가 예정', 'gemini2-flash': '평가 예정' },
      { name: '투명성 (Transparency)', 'gpt4-turbo': '평가 예정', 'claude3-opus': '평가 예정', 'gemini2-flash': '평가 예정' },
      { name: '피해 방지 (Harm Prevention)', 'gpt4-turbo': '평가 예정', 'claude3-opus': '평가 예정', 'gemini2-flash': '평가 예정' },
      { name: '안전성 (Safety)', 'gpt4-turbo': '평가 예정', 'claude3-opus': '평가 예정', 'gemini2-flash': '평가 예정' },
      { name: '유지 보수 (Maintenance)', 'gpt4-turbo': '평가 예정', 'claude3-opus': '평가 예정', 'gemini2-flash': '평가 예정' },
      { name: '위험 관리 (Risk Management)', 'gpt4-turbo': '평가 예정', 'claude3-opus': '평가 예정', 'gemini2-flash': '평가 예정' },
      { name: '안정성 (Stability)', 'gpt4-turbo': '평가 예정', 'claude3-opus': '평가 예정', 'gemini2-flash': '평가 예정' },
    ],
    psychology: [
      { 
        name: '발달심리학 - 피아제 인지발달이론', 
        'gpt4-turbo': psychologicalResults['gpt4-turbo']?.percentage ? `${psychologicalResults['gpt4-turbo'].percentage}% (${psychologicalResults['gpt4-turbo'].grade})` : '평가 없음',
        'claude3-opus': psychologicalResults['claude3-opus']?.percentage ? `${psychologicalResults['claude3-opus'].percentage}% (${psychologicalResults['claude3-opus'].grade})` : '평가 없음',
        'gemini2-flash': psychologicalResults['gemini2-flash']?.percentage ? `${psychologicalResults['gemini2-flash'].percentage}% (${psychologicalResults['gemini2-flash'].grade})` : '평가 없음'
      },
      { 
        name: '발달심리학 - 비고츠키 사회문화이론', 
        'gpt4-turbo': psychologicalResults['gpt4-turbo']?.completedQuestions ? `${psychologicalResults['gpt4-turbo'].completedQuestions}/${psychologicalResults['gpt4-turbo'].totalQuestions} 완료` : '평가 없음',
        'claude3-opus': psychologicalResults['claude3-opus']?.completedQuestions ? `${psychologicalResults['claude3-opus'].completedQuestions}/${psychologicalResults['claude3-opus'].totalQuestions} 완료` : '평가 없음',
        'gemini2-flash': psychologicalResults['gemini2-flash']?.completedQuestions ? `${psychologicalResults['gemini2-flash'].completedQuestions}/${psychologicalResults['gemini2-flash'].totalQuestions} 완료` : '평가 없음'
      },
      { 
        name: '사회심리학 - 사회적 정체성 이론', 
        'gpt4-turbo': psychologicalResults['gpt4-turbo']?.totalScore ? `${psychologicalResults['gpt4-turbo'].totalScore}/${psychologicalResults['gpt4-turbo'].maxScore}점` : '평가 없음',
        'claude3-opus': psychologicalResults['claude3-opus']?.totalScore ? `${psychologicalResults['claude3-opus'].totalScore}/${psychologicalResults['claude3-opus'].maxScore}점` : '평가 없음',
        'gemini2-flash': psychologicalResults['gemini2-flash']?.totalScore ? `${psychologicalResults['gemini2-flash'].totalScore}/${psychologicalResults['gemini2-flash'].maxScore}점` : '평가 없음'
      },
      { 
        name: '사회심리학 - 사회학습 이론', 
        'gpt4-turbo': '평가 진행 중',
        'claude3-opus': '평가 진행 중',
        'gemini2-flash': '평가 진행 중'
      },
      { 
        name: '인지심리학 - 정보처리 이론', 
        'gpt4-turbo': '평가 진행 중',
        'claude3-opus': '평가 진행 중',
        'gemini2-flash': '평가 진행 중'
      },
      { 
        name: '인지심리학 - 인지부하 이론', 
        'gpt4-turbo': '평가 진행 중',
        'claude3-opus': '평가 진행 중',
        'gemini2-flash': '평가 진행 중'
      },
    ],
    scenarioDeepEval: [
      // RAG 메트릭
      { 
        name: '충실성 (Faithfulness)', 
        category: 'RAG 메트릭',
        'gpt4-turbo': '평가 예정',
        'claude3-opus': '평가 예정',
        'gemini2-flash': '평가 예정'
      },
      { 
        name: '답변 관련성 (Answer Relevancy)', 
        category: 'RAG 메트릭',
        'gpt4-turbo': '평가 예정',
        'claude3-opus': '평가 예정',
        'gemini2-flash': '평가 예정'
      },
      { 
        name: '문맥 회상 (Contextual Recall)', 
        category: 'RAG 메트릭',
        'gpt4-turbo': '평가 예정',
        'claude3-opus': '평가 예정',
        'gemini2-flash': '평가 예정'
      },
      { 
        name: '문맥 정밀도 (Contextual Precision)', 
        category: 'RAG 메트릭',
        'gpt4-turbo': '평가 예정',
        'claude3-opus': '평가 예정',
        'gemini2-flash': '평가 예정'
      },
      // 안전성 메트릭
      { 
        name: '환각 방지 (Hallucination)', 
        category: '안전성 메트릭',
        'gpt4-turbo': '89.0% (양호)',
        'claude3-opus': '93.3% (우수)',
        'gemini2-flash': '100.0% (우수)'
      },
      { 
        name: '편향 방지 (Bias)', 
        category: '안전성 메트릭',
        'gpt4-turbo': '88.3% (양호)',
        'claude3-opus': '91.2% (우수)',
        'gemini2-flash': '90.4% (우수)'
      },
      { 
        name: '독성 방지 (Toxicity)', 
        category: '안전성 메트릭',
        'gpt4-turbo': '100.0% (우수)',
        'claude3-opus': '100.0% (우수)',
        'gemini2-flash': '100.0% (우수)'
      },
      { 
        name: 'PII 유출 방지', 
        category: '안전성 메트릭',
        'gpt4-turbo': '97.2% (우수)',
        'claude3-opus': '87.1% (양호)',
        'gemini2-flash': '77.8% (보통)'
      },
      // 품질 메트릭
      { 
        name: '일관성 (Coherence)', 
        category: '품질 메트릭',
        'gpt4-turbo': '85.0% (양호)',
        'claude3-opus': '96.9% (우수)',
        'gemini2-flash': '98.7% (우수)'
      },
      { 
        name: '프롬프트 정렬 (Prompt Alignment)', 
        category: '품질 메트릭',
        'gpt4-turbo': '87.0% (양호)',
        'claude3-opus': '99.1% (우수)',
        'gemini2-flash': '95.2% (우수)'
      },
      { 
        name: '명확성 (Clarity)', 
        category: '품질 메트릭',
        'gpt4-turbo': '81.0% (양호)',
        'claude3-opus': '88.1% (양호)',
        'gemini2-flash': '90.9% (우수)'
      },
      // 대화형 메트릭
      { 
        name: '역할 준수 (Role Adherence)', 
        category: '대화형 메트릭',
        'gpt4-turbo': '91.0% (우수)',
        'claude3-opus': '97.6% (우수)',
        'gemini2-flash': '98.3% (우수)'
      },
      { 
        name: '지식 보유 (Knowledge Retention)', 
        category: '대화형 메트릭',
        'gpt4-turbo': '78.0% (양호)',
        'claude3-opus': '40.4% (개선필요)',
        'gemini2-flash': '42.3% (개선필요)'
      },
      { 
        name: '대화 완성도 (Conversation Completeness)', 
        category: '대화형 메트릭',
        'gpt4-turbo': '86.0% (양호)',
        'claude3-opus': '91.6% (우수)',
        'gemini2-flash': '97.7% (우수)'
      },
      { 
        name: '전문성 (Expertise)', 
        category: '대화형 메트릭',
        'gpt4-turbo': '83.0% (양호)',
        'claude3-opus': '96.5% (우수)',
        'gemini2-flash': '97.6% (우수)'
      },
    ],
    scenarioDeepTeam: [
      // 보안 평가 메트릭 (DeepTeam)
      { 
        name: '전체 보안 등급', 
        category: '종합 평가',
        'gpt4-turbo': '93.3% (A)',
        'claude3-opus': '92.7% (A)',
        'gemini2-flash': '98.0% (A+)'
      },
      { 
        name: '탈옥 공격 (Jailbreaking)', 
        category: '공격 시나리오',
        'gpt4-turbo': '100.0% (우수)',
        'claude3-opus': '100.0% (우수)',
        'gemini2-flash': '100.0% (우수)'
      },
      { 
        name: '프롬프트 주입 (Prompt Injection)', 
        category: '공격 시나리오',
        'gpt4-turbo': '100.0% (우수)',
        'claude3-opus': '100.0% (우수)',
        'gemini2-flash': '100.0% (우수)'
      },
      { 
        name: '개인정보 유출 (PII Leakage)', 
        category: '취약점 시나리오',
        'gpt4-turbo': '100.0% (우수)',
        'claude3-opus': '53.3% (취약)',
        'gemini2-flash': '86.7% (양호)'
      },
      { 
        name: '프롬프트 추출 (Prompt Extraction)', 
        category: '취약점 시나리오',
        'gpt4-turbo': '86.7% (양호)',
        'claude3-opus': '86.7% (양호)',
        'gemini2-flash': '93.3% (우수)'
      },
      { 
        name: '인코딩 공격 (Encoding Attacks)', 
        category: '공격 시나리오',
        'gpt4-turbo': '86.7% (양호)',
        'claude3-opus': '93.3% (우수)',
        'gemini2-flash': '100.0% (우수)'
      },
    ],
    expert: [],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white/90 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
                              뒤로가기
            </button>
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                AI 모델 비교 분석
              </h1>
              <p className="mt-2 text-gray-600">여러 AI 모델의 성능과 안전성을 종합적으로 비교분석합니다.</p>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Model Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {models.map((model, index) => (
              <div
                key={model.name}
                className="group relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${model.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                {/* Content */}
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${model.gradient} shadow-lg`}>
                      <model.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      model.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {model.status === 'active' ? '활성화' : '테스트 중'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-800">
                    {model.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{model.provider}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <ChartBarIcon className="h-4 w-4 mr-2" />
                        정확도
                      </div>
                      <span className="font-semibold text-gray-900">{model.accuracy}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        응답 시간
                      </div>
                      <span className="font-semibold text-gray-900">{model.latency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                        비용
                      </div>
                      <span className="font-semibold text-gray-900">{model.cost}</span>
                    </div>
                  </div>
                </div>
                
                {/* Decorative corner element */}
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 transform">
                  <div className={`h-full w-full rounded-full bg-gradient-to-r ${model.gradient} opacity-10`}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Evaluation Tabs */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">평가 기준별 모델 비교</h2>
            
            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                      : 'bg-white/80 text-gray-700 hover:bg-white/90 hover:shadow-md hover:scale-105'
                  } inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform backdrop-blur-sm border border-white/20`}
                >
                  <span className="mr-2 text-lg">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="mt-8">
              {/* Tab Description and Action Button */}
              <div className="mb-6 p-6 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20">
                {activeTab === 'psychology' && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">심리학 기반 체크리스트 평가</h3>
                      <p className="text-sm text-gray-600">
                        심리학 기반 체크리스트 평가 결과를 확인하세요. 평가가 완료되지 않은 모델은 평가 페이지에서 평가를 진행해주세요.
                      </p>
                    </div>
                    <button
                      onClick={() => router.push('/governance-framework/psychological-evaluation')}
                      className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
                    >
                      심리학 평가 진행
                    </button>
                  </div>
                )}
                {activeTab === 'scenario' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">시나리오 기반 평가</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          DeepEval 신뢰성 프레임워크와 DeepTeam 보안 평가 프레임워크를 통합적으로 활용한 AI 모델 평가 결과입니다.
                        </p>
                      </div>
                      <button
                        onClick={() => router.push('/governance-framework/scenario-evaluation')}
                        className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
                      >
                        시나리오 평가 진행
                      </button>
                    </div>

                    {/* 시나리오 평가 하위 탭 */}
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setActiveScenarioTab('deepeval')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeScenarioTab === 'deepeval'
                            ? 'bg-white text-blue-600 shadow'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        DeepEval 신뢰성 평가
                      </button>
                      <button
                        onClick={() => setActiveScenarioTab('deepteam')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeScenarioTab === 'deepteam'
                            ? 'bg-white text-rose-600 shadow'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        DeepTeam 보안 평가
                      </button>
                    </div>

                    {/* 탭별 설명 */}
                    {activeScenarioTab === 'deepeval' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">🔍 DeepEval 신뢰성 평가</h4>
                        <div className="space-y-1 text-xs">
                          <div className="text-green-600 font-medium">✅ 안전성 메트릭 (4/4): 환각 방지, 편향 방지, 독성 방지, PII 유출 방지</div>
                          <div className="text-green-600 font-medium">✅ 품질 메트릭 (3/3): 명확성, 일관성, 프롬프트 정렬</div>
                          <div className="text-green-600 font-medium">✅ 대화형 메트릭 (4/4): 전문성, 역할 준수, 지식 보유, 대화 완성도</div>
                          <div className="text-blue-600 font-medium">🔄 RAG 메트릭 (0/4): 충실성, 답변 관련성, 문맥 회상, 문맥 정밀도</div>
                        </div>
                      </div>
                    )}
                    {activeScenarioTab === 'deepteam' && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-rose-900 mb-2">🔒 DeepTeam 보안 평가</h4>
                        <div className="space-y-1 text-xs">
                          <div className="text-green-600 font-medium">✅ 전체 저항률: 94.7% (150회 테스트)</div>
                          <div className="text-green-600 font-medium">✅ 모델별 등급: Gemini (A+), ChatGPT (A), Claude (A)</div>
                          <div className="text-amber-600 font-medium">⚠️ 식별된 취약점: PII 유출, 프롬프트 추출</div>
                          <div className="text-blue-600 font-medium">📊 5가지 보안 메트릭 평가 완료</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'ethics' && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 윤리 평가지표</h3>
                      <p className="text-sm text-gray-600">
                        AI 윤리 평가지표 결과를 확인하세요. 각 윤리 기준별로 상세한 평가를 진행할 수 있습니다.
                      </p>
                    </div>
                    <button
                      onClick={() => router.push('/governance-framework/ai-ethics-evaluation')}
                      className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
                    >
                      윤리 평가 진행
                    </button>
                  </div>
                )}
                {activeTab === 'expert' && (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">전문가 정성평가</h3>
                    <p className="text-sm text-gray-600">
                      전문가 정성평가 기능은 준비 중입니다.
                    </p>
                  </div>
                )}
              </div>

              {/* Evaluation Results Table */}
              {activeTab !== 'expert' && (
                <div className="overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">
                            평가 항목
                          </th>
                          <th className="py-4 px-6 text-center text-sm font-semibold text-gray-900">
                            GPT-4-turbo
                          </th>
                          <th className="py-4 px-6 text-center text-sm font-semibold text-gray-900">
                            Claude-3-opus
                          </th>
                          <th className="py-4 px-6 text-center text-sm font-semibold text-gray-900">
                            Gemini-2.0-flash
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(() => {
                          if (activeTab === 'scenario') {
                            const currentMetrics = activeScenarioTab === 'deepeval' 
                              ? evaluationMetrics.scenarioDeepEval 
                              : evaluationMetrics.scenarioDeepTeam;
                            return currentMetrics.length === 0;
                          }
                          return evaluationMetrics[activeTab as keyof typeof evaluationMetrics].length === 0;
                        })() ? (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <div className="text-4xl mb-4">📊</div>
                                <p className="text-lg font-medium">평가 항목을 추가해주세요</p>
                              </div>
                            </td>
                          </tr>
                        ) : activeTab === 'scenario' ? (
                          // 시나리오 평가는 하위 탭에 따라 다르게 표시
                          (() => {
                            const currentMetrics = activeScenarioTab === 'deepeval' 
                              ? evaluationMetrics.scenarioDeepEval 
                              : evaluationMetrics.scenarioDeepTeam;
                            
                            const categories = activeScenarioTab === 'deepeval'
                              ? ['RAG 메트릭', '안전성 메트릭', '품질 메트릭', '대화형 메트릭']
                              : ['종합 평가', '공격 시나리오', '취약점 시나리오'];
                              
                            const categoryColors: {[key: string]: string} = {
                              'RAG 메트릭': 'bg-gradient-to-r from-sky-50 to-blue-50',
                              '안전성 메트릭': 'bg-gradient-to-r from-rose-50 to-pink-50',
                              '품질 메트릭': 'bg-gradient-to-r from-emerald-50 to-green-50',
                              '대화형 메트릭': 'bg-gradient-to-r from-violet-50 to-purple-50',
                              '종합 평가': 'bg-gradient-to-r from-indigo-50 to-purple-50',
                              '공격 시나리오': 'bg-gradient-to-r from-red-50 to-orange-50',
                              '취약점 시나리오': 'bg-gradient-to-r from-amber-50 to-yellow-50'
                            };
                            
                            return categories.map(category => {
                              const categoryMetrics = currentMetrics.filter((metric: any) => metric.category === category);
                              if (categoryMetrics.length === 0) return null;
                              
                              return (
                                <React.Fragment key={category}>
                                  <tr className={categoryColors[category]}>
                                    <td colSpan={4} className="py-3 px-6 text-sm font-bold text-gray-800 uppercase tracking-wider">
                                      {category}
                                    </td>
                                  </tr>
                                  {categoryMetrics.map((metric: any) => (
                                    <tr key={metric.name} className="hover:bg-white/60 transition-colors duration-200">
                                      <td className="py-4 px-6 pl-12 text-sm font-medium text-gray-900">
                                        {metric.name}
                                      </td>
                                      <td className="py-4 px-6 text-center text-sm text-gray-600">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                          metric['gpt4-turbo'] === '평가 예정' 
                                            ? 'bg-gray-100 text-gray-700'
                                            : metric['gpt4-turbo'].includes('우수')
                                            ? 'bg-green-100 text-green-800'
                                            : metric['gpt4-turbo'].includes('양호')
                                            ? 'bg-blue-100 text-blue-800'
                                            : metric['gpt4-turbo'].includes('보통')
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : metric['gpt4-turbo'].includes('개선필요')
                                            ? 'bg-red-100 text-red-800'
                                            : metric['gpt4-turbo'].includes('취약')
                                            ? 'bg-red-200 text-red-900'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                          {metric['gpt4-turbo']}
                                        </span>
                                      </td>
                                      <td className="py-4 px-6 text-center text-sm text-gray-600">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                          metric['claude3-opus'] === '평가 예정' 
                                            ? 'bg-gray-100 text-gray-700'
                                            : metric['claude3-opus'].includes('우수')
                                            ? 'bg-green-100 text-green-800'
                                            : metric['claude3-opus'].includes('양호')
                                            ? 'bg-blue-100 text-blue-800'
                                            : metric['claude3-opus'].includes('보통')
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : metric['claude3-opus'].includes('개선필요')
                                            ? 'bg-red-100 text-red-800'
                                            : metric['claude3-opus'].includes('취약')
                                            ? 'bg-red-200 text-red-900'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                          {metric['claude3-opus']}
                                        </span>
                                      </td>
                                      <td className="py-4 px-6 text-center text-sm text-gray-600">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                          metric['gemini2-flash'] === '평가 예정' 
                                            ? 'bg-gray-100 text-gray-700'
                                            : metric['gemini2-flash'].includes('우수')
                                            ? 'bg-green-100 text-green-800'
                                            : metric['gemini2-flash'].includes('양호')
                                            ? 'bg-blue-100 text-blue-800'
                                            : metric['gemini2-flash'].includes('보통')
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : metric['gemini2-flash'].includes('개선필요')
                                            ? 'bg-red-100 text-red-800'
                                            : metric['gemini2-flash'].includes('취약')
                                            ? 'bg-red-200 text-red-900'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                          {metric['gemini2-flash']}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              );
                            });
                          })()
                        ) : activeTab !== 'scenario' ? (
                          // 다른 탭들은 기존 방식대로
                          evaluationMetrics[activeTab as keyof typeof evaluationMetrics].map((metric: any, index) => (
                            <tr key={metric.name} className="hover:bg-white/60 transition-colors duration-200">
                              <td className="py-4 px-6 text-sm font-medium text-gray-900">
                                {metric.name}
                              </td>
                              <td className="py-4 px-6 text-center text-sm">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  metric['gpt4-turbo'] === '평가 없음' || metric['gpt4-turbo'] === '평가 예정' || metric['gpt4-turbo'] === '평가 진행 중'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {metric['gpt4-turbo']}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center text-sm">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  metric['claude3-opus'] === '평가 없음' || metric['claude3-opus'] === '평가 예정' || metric['claude3-opus'] === '평가 진행 중'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {metric['claude3-opus']}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center text-sm">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  metric['gemini2-flash'] === '평가 없음' || metric['gemini2-flash'] === '평가 예정' || metric['gemini2-flash'] === '평가 진행 중'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {metric['gemini2-flash']}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 