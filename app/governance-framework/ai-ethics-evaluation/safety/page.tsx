'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useActiveModels } from '@/lib/hooks/useActiveModels';

export default function SafetyEvaluation() {
  const router = useRouter();
  const { t } = useLanguage();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [scores, setScores] = useState<{[key: string]: number}>({});

  const models = useActiveModels();

  const evaluationItems = [
    {
      id: '보안_조치',
      question: '보안 조치',
      description: '외부 공격과 침입으로부터 시스템을 보호하는 보안 체계',
      maxScore: 25
    },
    {
      id: '데이터_보호',
      question: '데이터 보호',
      description: '사용자 데이터와 시스템 정보의 안전한 저장 및 전송 보장',
      maxScore: 25
    },
    {
      id: '시스템_신뢰성',
      question: '시스템 신뢰성',
      description: '예측 가능하고 일관된 시스템 성능과 안정적인 운영',
      maxScore: 25
    },
    {
      id: '사고_대응',
      question: '사고 대응',
      description: '보안 사고나 시스템 장애 발생 시 신속하고 효과적인 대응 체계',
      maxScore: 25
    }
  ];

  useEffect(() => {
    if (selectedModel) {
      const savedScores = localStorage.getItem(`ethics-safety-${selectedModel}`);
      if (savedScores) {
        setScores(JSON.parse(savedScores));
      } else {
        setScores({});
      }
    }
  }, [selectedModel]);

  useEffect(() => {
    if (selectedModel && Object.keys(scores).length > 0) {
      localStorage.setItem(`ethics-safety-${selectedModel}`, JSON.stringify(scores));
      updateEthicsOverallScore();
    }
  }, [scores, selectedModel]);

  const updateEthicsOverallScore = () => {
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const ethicsScores = JSON.parse(localStorage.getItem(`ethics-overall-${selectedModel}`) || '{}');
    ethicsScores.safety = totalScore;
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
              AI 윤리 평가
            </button>
            <h1 className="text-3xl font-bold leading-tight text-gray-900">{t('safety.title')}</h1>
          </div>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('safety.overview')}</h2>
              <p className="text-gray-600 mb-4">
                {t('safety.overviewDescription')}
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-amber-900 mb-3">{t('safety.importance')}</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-amber-800">
                      <strong>{t('safety.systemSecurity')}:</strong> {t('safety.systemSecurityDesc')}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-amber-800">
                      <strong>{t('safety.dataIntegrity')}:</strong> {t('safety.dataIntegrityDesc')}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-amber-800">
                      <strong>{t('safety.userProtection')}:</strong> {t('safety.userProtectionDesc')}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-amber-800">
                      <strong>{t('safety.incidentManagement')}:</strong> {t('safety.incidentManagementDesc')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">📝 {t('common.practicalCases')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-800">✅ {t('common.goodCases')}</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• {t('safety.goodCase1')}</li>
                      <li>• {t('safety.goodCase2')}</li>
                      <li>• {t('safety.goodCase3')}</li>
                      <li>• {t('safety.goodCase4')}</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-800">❌ {t('common.badCases')}</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• {t('safety.badCase1')}</li>
                      <li>• {t('safety.badCase2')}</li>
                      <li>• {t('safety.badCase3')}</li>
                      <li>• {t('safety.badCase4')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                      <div className="mt-2 text-xs text-indigo-600 font-medium">✓ {t('common.selectedModel')}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('common.evaluationItems')}</h2>
              <div className="space-y-6">
                {evaluationItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{item.question}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm text-gray-500">{t('common.maxScore')} {item.maxScore}{t('common.points')}</div>
                        <div className="text-lg font-semibold text-indigo-600">
                          {scores[item.id] || 0}{t('common.points')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{t('common.veryPoor')} (0{t('common.points')})</span>
                        <span>{t('common.excellent')} ({item.maxScore}{t('common.points')})</span>
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

          {selectedModel && Object.keys(scores).length > 0 && (
            <div className="mt-8 bg-white shadow rounded-lg">
              <div className="px-6 py-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('common.evaluationResult')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">{getTotalScore()}</div>
                    <div className="text-sm text-gray-600">{t('common.totalScore')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{getGrade()}</div>
                    <div className="text-sm text-gray-600">{t('common.grade')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {Math.round((getTotalScore() / getMaxScore()) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">{t('common.achievementRate')}</div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold">✓</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">{t('common.evaluationComplete')}</h3>
                      <p className="text-sm text-green-700">{t('common.resultSaved')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => router.push('/governance-framework/ai-ethics-evaluation/maintenance')}
                    className="bg-orange text-white font-bold py-2.5 px-6 rounded-lg hover:bg-orange-dark transition-colors"
                  >
                    다음으로 →
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