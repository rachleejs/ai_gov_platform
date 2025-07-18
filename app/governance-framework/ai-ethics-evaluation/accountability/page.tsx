'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useActiveModels } from '@/lib/hooks/useActiveModels';

export default function AccountabilityEvaluation() {
  const router = useRouter();
  const { t } = useLanguage();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [scores, setScores] = useState<{[key: string]: number}>({});

  // 모델 옵션 (DB에서 동적 로드)
  const models = useActiveModels();

  // 평가 항목들
  const evaluationItems = [
    {
      id: 'decision_traceability',
      question: t('accountability.decisionTraceability'),
      description: t('accountability.decisionTraceabilityDesc'),
      maxScore: 25
    },
    {
      id: 'error_handling',
      question: t('accountability.errorHandling'),
      description: t('accountability.errorHandlingDesc'),
      maxScore: 25
    },
    {
      id: 'human_oversight',
      question: t('accountability.humanOversight'),
      description: t('accountability.humanOversightDesc'),
      maxScore: 25
    },
    {
      id: 'accountability_mechanism',
      question: t('accountability.accountabilityMechanism'),
      description: t('accountability.accountabilityMechanismDesc'),
      maxScore: 25
    }
  ];

  // 로컬 스토리지에서 점수 로드
  useEffect(() => {
    if (selectedModel) {
      const savedScores = localStorage.getItem(`ethics-accountability-${selectedModel}`);
      if (savedScores) {
        setScores(JSON.parse(savedScores));
      } else {
        setScores({});
      }
    }
  }, [selectedModel]);
    
  // 점수 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (selectedModel && Object.keys(scores).length > 0) {
      localStorage.setItem(`ethics-accountability-${selectedModel}`, JSON.stringify(scores));
      // 전체 윤리 평가 결과에도 반영
      updateEthicsOverallScore();
    }
  }, [scores, selectedModel]);

  const updateEthicsOverallScore = () => {
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const ethicsScores = JSON.parse(localStorage.getItem(`ethics-overall-${selectedModel}`) || '{}');
    ethicsScores.accountability = totalScore;
    localStorage.setItem(`ethics-overall-${selectedModel}`, JSON.stringify(ethicsScores));
  };

  const handleScoreChange = (itemId: string, score: number) => {
    if (!selectedModel) {
      alert(t('common.selectModel'));
      return;
    }
      setScores(prev => ({
        ...prev,
        [itemId]: score
      }));
  };

  const getTotalScore = () => {
    return Object.values(scores).reduce((sum, score) => sum + score, 0);
  };

  const getMaxScore = () => {
    return evaluationItems.reduce((sum, item) => sum + item.maxScore, 0);
  };

  const getGrade = () => {
    const percentage = (getTotalScore() / getMaxScore()) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
              <button
              onClick={() => router.push('/governance-framework/ai-ethics-evaluation')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              {t('accountability.backToEthics')}
              </button>
            <h1 className="text-3xl font-bold leading-tight text-gray-900">{t('accountability.title')}</h1>
          </div>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* 평가 기준 설명 */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('accountability.overview')}</h2>
              <p className="text-gray-600 mb-4">
                {t('accountability.overviewDescription')}
              </p>
              
              {/* 일반 사용자 대상 중요성 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-amber-900 mb-3">👥 {t('accountability.importance')}</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-amber-800">
                      <strong>{t('accountability.userTrust')}:</strong> {t('accountability.userTrustDesc')}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-amber-800">
                      <strong>{t('accountability.userRights')}:</strong> {t('accountability.userRightsDesc')}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-amber-800">
                      <strong>{t('accountability.damageRecovery')}:</strong> {t('accountability.damageRecoveryDesc')}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-amber-800">
                      <strong>{t('accountability.legalCompliance')}:</strong> {t('accountability.legalComplianceDesc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 실제 사례 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">📝 {t('accountability.practicalCases')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-800">✅ {t('accountability.goodCases')}</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• {t('accountability.goodCase1')}</li>
                      <li>• {t('accountability.goodCase2')}</li>
                      <li>• {t('accountability.goodCase3')}</li>
                      <li>• {t('accountability.goodCase4')}</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-800">❌ {t('accountability.badCases')}</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• {t('accountability.badCase1')}</li>
                      <li>• {t('accountability.badCase2')}</li>
                      <li>• {t('accountability.badCase3')}</li>
                      <li>• {t('accountability.badCase4')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* 모델 선택 */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('common.modelSelection')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {models.map((model) => (
                  <div
                key={model.id}
                    className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                  selectedModel === model.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                }`}
                    onClick={() => setSelectedModel(model.id)}
              >
                    <div className="text-lg font-medium text-gray-900">{model.name}</div>
                <div className="text-sm text-gray-500">{model.provider}</div>
                    {selectedModel === model.id && (
                      <div className="mt-2 text-xs text-indigo-600 font-medium">✓ {t('accountability.selectedModel')}</div>
                    )}
                  </div>
            ))}
          </div>
        </div>
          </div>

        {/* 평가 항목들 */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('accountability.evaluationItems')}</h2>
        <div className="space-y-6">
          {evaluationItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{item.question}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
              </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm text-gray-500">{t('accountability.maxScore')} {item.maxScore}{t('accountability.points')}</div>
                        <div className="text-lg font-semibold text-indigo-600">
                          {scores[item.id] || 0}{t('accountability.points')}
                        </div>
                      </div>
                </div>
                
                    {/* 점수 슬라이더 */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{t('accountability.veryPoor')} (0{t('accountability.points')})</span>
                        <span>{t('accountability.excellent')} ({item.maxScore}{t('accountability.points')})</span>
                      </div>
                  <input
                    type="range"
                    min="0"
                    max={item.maxScore}
                    value={scores[item.id] || 0}
                    onChange={(e) => handleScoreChange(item.id, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        disabled={!selectedModel}
                  />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>0</span>
                        <span>{Math.floor(item.maxScore/4)}</span>
                        <span>{Math.floor(item.maxScore/2)}</span>
                        <span>{Math.floor(item.maxScore*3/4)}</span>
                        <span>{item.maxScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
            </div>
          </div>
          
          {/* 평가 결과 */}
          {selectedModel && Object.keys(scores).length > 0 && (
            <div className="mt-8 bg-white shadow rounded-lg">
              <div className="px-6 py-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('accountability.evaluationResult')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-indigo-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-900">{getTotalScore()}</div>
                    <div className="text-sm text-indigo-600">{t('accountability.totalScore')}</div>
                    <div className="text-xs text-indigo-500">{t('accountability.maxScore')} {getMaxScore()}{t('accountability.points')}</div>
              </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-900">
                      {Math.round((getTotalScore() / getMaxScore()) * 100)}%
                    </div>
                    <div className="text-sm text-blue-600">{t('accountability.achievementRate')}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-900">{getGrade()}</div>
                    <div className="text-sm text-green-600">{t('accountability.grade')}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-900">{Object.keys(scores).length}</div>
                    <div className="text-sm text-purple-600">{t('accountability.completedItems')}</div>
                    <div className="text-xs text-purple-500">{t('accountability.totalItems')} {evaluationItems.length}{t('accountability.items')}</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{t('accountability.evaluationComplete')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('accountability.resultSaved')}
                  </p>
                  <button
                    onClick={() => router.push('/model-comparison')}
                    className="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                  >
                    {t('accountability.viewComparison')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 