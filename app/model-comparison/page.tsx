'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ChartBarIcon, ServerIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

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
  const [psychologicalResults, setPsychologicalResults] = useState<{ [key: string]: EvaluationResult }>({});

  const getModelKey = (modelName: string) => {
    const keyMap: { [key: string]: string } = {
      'GPT-4-turbo': 'gpt4-turbo',
      'Claude-3-opus': 'claude3-opus',
      'Gemini-2.0-flash': 'gemini2-flash'
    };
    return keyMap[modelName] || modelName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  };

  const models = [
    { name: 'GPT-4-turbo', provider: 'OpenAI', icon: ServerIcon },
    { name: 'Claude-3-opus', provider: 'Anthropic', icon: ServerIcon },
    { name: 'Gemini-2.0-flash', provider: 'Google', icon: ServerIcon },
  ];

  useEffect(() => {
    const loadPsychologicalResults = () => {
      const results: { [key: string]: EvaluationResult } = {};
      models.forEach(model => {
        const modelKey = getModelKey(model.name);
        const savedScores = localStorage.getItem(`psychological-evaluation-${modelKey}`);
        if (savedScores) {
          const scores = JSON.parse(savedScores);
          const scoreValues = Object.values(scores) as number[];
          const totalScore = scoreValues.reduce((sum, score) => sum + score, 0);
          const completedQuestions = scoreValues.length;
          const totalQuestions = 72;
          const maxScore = totalQuestions * 5;
          const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
          let grade = 'F';
          if (percentage >= 90) grade = 'A+';
          else if (percentage >= 80) grade = 'A';
          else if (percentage >= 70) grade = 'B+';
          else if (percentage >= 60) grade = 'B';
          else if (percentage >= 50) grade = 'C';
          results[modelKey] = { totalScore, maxScore, percentage, grade, completedQuestions, totalQuestions };
        }
      });
      setPsychologicalResults(results);
    };

    loadPsychologicalResults();
    window.addEventListener('storage', loadPsychologicalResults);
    return () => window.removeEventListener('storage', loadPsychologicalResults);
  }, []);

  const tabs = [
    { id: 'ethics', name: '윤리 평가' },
    { id: 'psychology', name: '심리 평가' },
    { id: 'scenario', name: '시나리오 평가' },
    { id: 'expert', name: '전문가 평가' },
  ];

  const getEthicsScore = (modelKey: string, criterion: string) => {
    if (typeof window === 'undefined') return { score: 'N/A' };
    const savedScores = localStorage.getItem(`ethics-${criterion}-${modelKey}`);
    if (savedScores) {
      const scores = JSON.parse(savedScores);
      const totalScore = Object.values(scores).reduce((sum: number, score: any) => sum + score, 0);
      const isCompleted = Object.keys(scores).length > 0;
      return { score: `${totalScore}점`, completed: isCompleted };
    }
    return { score: '미평가', completed: false };
  };

  const evaluationMetrics = {
    ethics: [
      { name: '책임성 (Accountability)', criterion: 'accountability' },
      { name: '데이터/개인정보보호', criterion: 'data-privacy' },
      { name: '공정성 (Fairness)', criterion: 'fairness' },
      { name: '포용성 (Inclusion)', criterion: 'inclusion' },
      { name: '투명성 (Transparency)', criterion: 'transparency' },
      { name: '피해 방지 (Harm Prevention)', criterion: 'harm-prevention' },
      { name: '안전성 (Safety)', criterion: 'safety' },
      { name: '유지 보수 (Maintenance)', criterion: 'maintenance' },
      { name: '위험 관리 (Risk Management)', criterion: 'risk-management' },
      { name: '안정성 (Stability)', criterion: 'stability' },
    ],
    psychology: [
      { name: '발달심리학 - 피아제 인지발달이론' },
      { name: '발달심리학 - 비고츠키 사회문화이론' },
      { name: '사회심리학 - 사회적 정체성 이론' },
      { name: '사회심리학 - 사회학습 이론' },
      { name: '인지심리학 - 정보처리 이론' },
      { name: '인지심리학 - 인지부하 이론' },
    ],
    scenarioDeepEval: [
      { name: '충실성 (Faithfulness)', category: 'RAG 메트릭' },
      { name: '답변 관련성 (Answer Relevancy)', category: 'RAG 메트릭' },
      { name: '문맥 회상 (Contextual Recall)', category: 'RAG 메트릭' },
      { name: '문맥 정밀도 (Contextual Precision)', category: 'RAG 메트릭' },
      { name: '편향성 (Bias)', category: '안전성 메트릭' },
      { name: '악의성 (Maliciousness)', category: '안전성 메트릭' },
      { name: '정확성 (Correctness)', category: '품질 메트릭' },
      { name: '일관성 (Coherence)', category: '품질 메트릭' },
      { name: '유해성 (Toxicity)', category: '안전성 메트릭' },
      { name: '자세함 (Verbosity)', category: '대화형 메트릭' },
      { name: '용기 (Courage)', category: '대화형 메트릭' },
      { name: '그룹 편향 (Group Fairness)', category: '편향 메트릭' }
    ],
    expert: [
      { name: '전문가 패널 리뷰', description: '해당 분야 전문가들의 정성적 평가 및 피드백' },
      { name: '레드팀 평가', description: '적대적 시나리오를 통한 시스템 취약점 분석' },
      { name: '규제 준수성 검토', description: '관련 법규 및 가이드라인 준수 여부 확인' },
    ]
  };

  const renderEthicsTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-green uppercase bg-grey">
          <tr>
            <th scope="col" className="px-6 py-3 rounded-l-lg">평가 항목</th>
            {models.map(model => <th key={model.name} scope="col" className="px-6 py-3 text-center">{model.name}</th>)}
            <th scope="col" className="px-6 py-3 rounded-r-lg text-center">평균</th>
          </tr>
        </thead>
        <tbody>
          {evaluationMetrics.ethics.map((metric, index) => (
            <tr key={index} className="bg-white border-b border-grey/50">
              <th scope="row" className="px-6 py-4 font-medium text-green whitespace-nowrap">{metric.name}</th>
              {models.map(model => {
                const modelKey = getModelKey(model.name);
                const result = getEthicsScore(modelKey, metric.criterion);
                return (
                  <td key={model.name} className="px-6 py-4 text-center font-semibold">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.completed ? 'bg-green/10 text-green' : 'bg-grey/50 text-gray-800'}`}>
                      {result.completed ? <CheckCircleIcon className="w-3 h-3 mr-1" /> : <XCircleIcon className="w-3 h-3 mr-1" />}
                      {result.score}
                    </span>
                  </td>
                );
              })}
              <td className="px-6 py-4 text-center font-bold text-green">평균</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPsychologyTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-green uppercase bg-grey">
          <tr>
            <th scope="col" className="px-6 py-3 rounded-l-lg">평가 항목</th>
            {models.map(model => <th key={model.name} scope="col" className="px-6 py-3 text-center">{model.name}</th>)}
            <th scope="col" className="px-6 py-3 rounded-r-lg text-center">평균</th>
          </tr>
        </thead>
        <tbody>
          {evaluationMetrics.psychology.map((metric, index) => {
            return (
              <tr key={index} className="bg-white border-b border-grey/50">
                <th scope="row" className="px-6 py-4 font-medium text-green whitespace-nowrap">{metric.name}</th>
                {models.map(model => {
                  const modelKey = getModelKey(model.name);
                  const result = psychologicalResults[modelKey];
                  return (
                    <td key={model.name} className="px-6 py-4 text-center font-semibold">
                      {result ? (
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-green">{result.percentage}%</span>
                          <span className="text-xs text-gray-800">({result.grade} 등급)</span>
                        </div>
                      ) : (
                        <span className="text-gray-800">미평가</span>
                      )}
                    </td>
                  )
                })}
                <td className="px-6 py-4 text-center font-bold text-green">평균</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );

  const renderScenarioTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-green uppercase bg-grey">
          <tr>
            <th scope="col" className="px-6 py-3 rounded-l-lg">평가 항목</th>
            <th scope="col" className="px-6 py-3">카테고리</th>
            {models.map(model => <th key={model.name} scope="col" className="px-6 py-3 text-center">{model.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {evaluationMetrics.scenarioDeepEval.map((metric, index) => (
            <tr key={index} className="bg-white border-b border-grey/50">
              <th scope="row" className="px-6 py-4 font-medium text-green whitespace-nowrap">{metric.name}</th>
              <td className="px-6 py-4"><span className="text-xs bg-grey/50 text-gray-800 px-2 py-1 rounded-md">{metric.category}</span></td>
              {models.map(model => <td key={model.name} className="px-6 py-4 text-center text-gray-500">평가 예정</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderExpertPanel = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {evaluationMetrics.expert.map((item, index) => (
        <div key={index} className="bg-white p-6 rounded-xl shadow-md border border-grey/30">
          <h4 className="text-lg font-semibold text-green mb-2">{item.name}</h4>
          <p className="text-sm text-gray-600">{item.description}</p>
          <button className="mt-4 w-full text-sm font-medium text-green bg-grey/50 py-2 rounded-lg hover:bg-grey">
            자세히 보기
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-grey min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-grey/50 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-grey/50 border border-grey/50 rounded-lg hover:bg-grey"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              메인으로
            </button>
            <h1 className="text-xl font-bold text-green">모델 비교 분석</h1>
          </div>
        </div>
      </header>
      <main className="py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-green mb-2">AI 모델 상세 비교</h2>
          <p className="text-gray-700 max-w-3xl mx-auto">
            다양한 평가 기준에 따라 주요 AI 모델들의 성능을 심층적으로 비교하고 분석합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {models.map((model) => (
            <div key={model.name} className="bg-white p-6 rounded-xl shadow-lg border border-grey/30">
              <div className="flex items-center">
                <model.icon className="w-8 h-8 text-green mr-4" />
                <div>
                  <h3 className="text-lg font-semibold text-green">{model.name}</h3>
                  <p className="text-sm text-gray-600">{model.provider}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex space-x-1 bg-grey/30 rounded-lg p-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors 
                    ${activeTab === tab.id ? 'bg-green text-white shadow' : 'text-gray-700 hover:bg-grey/50'}`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          {activeTab === 'ethics' && renderEthicsTable()}
          {activeTab === 'psychology' && renderPsychologyTable()}
          {activeTab === 'scenario' && renderScenarioTable()}
          {activeTab === 'expert' && renderExpertPanel()}
        </div>
      </main>
    </div>
  );
} 