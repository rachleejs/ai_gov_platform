'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useAuth } from '@/app/contexts/AuthContext';

interface Question {
  id: string;
  question: string;
  description: string;
  maxScore: number;
}

// 하드코딩된 질문들 (i18n 문제 우회용)
const defaultQuestions: Question[] = [
  {
    id: '의사결정_추적성',
    question: '의사결정 추적성',
    description: 'AI 시스템의 결정이 어떻게 이루어졌는지 추적하고 설명할 수 있는 능력',
    maxScore: 25
  },
  {
    id: '오류_처리_메커니즘',
    question: '오류 처리 메커니즘',
    description: '시스템 오류 발생 시 적절한 대응 및 복구 방안 마련',
    maxScore: 25
  },
  {
    id: '인간_감독',
    question: '인간 감독',
    description: 'AI 시스템에 대한 인간의 감독 및 개입 가능성',
    maxScore: 25
  },
  {
    id: '책임_메커니즘',
    question: '책임 메커니즘',
    description: '문제 발생 시 책임 소재 파악 및 보상 체계',
    maxScore: 25
  }
];

export default function AccountabilityEvaluation() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [models, setModels] = useState<{ id: string, name: string }[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [totalScore, setTotalScore] = useState<number>(0);
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 번역된 질문을 가져오려고 시도하되, 실패하면 기본값 사용
  const questions = defaultQuestions;

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          setModels(data);
          if (data.length > 0) {
            setSelectedModel(data[0].id);
          }
        } else {
          console.error('Failed to fetch models');
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (!selectedModel || !user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/evaluation/ethics?modelId=${selectedModel}&category=accountability`);
        if (response.ok) {
          const data = await response.json();
          const savedEval = data.find((e: any) => e.category === 'accountability');
          if (savedEval && savedEval.scores) {
            setScores(savedEval.scores);
            setFeedback(savedEval.feedback || '');
          } else {
            // If there's an eval but no scores object, or no eval at all
            setScores({});
            setFeedback('');
          }
        }
      } catch (error) {
        console.error('Error fetching evaluation:', error);
        setScores({});
        setFeedback('');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvaluation();
  }, [selectedModel, user]);

  useEffect(() => {
    const newTotalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const maxScore = questions.reduce((sum, q) => sum + q.maxScore, 0);
    setTotalScore(newTotalScore);

    if (maxScore > 0) {
      const percentage = (newTotalScore / maxScore) * 100;
      let newGrade = 'F';
      if (percentage >= 90) newGrade = 'A+';
      else if (percentage >= 80) newGrade = 'A';
      else if (percentage >= 70) newGrade = 'B';
      else if (percentage >= 60) newGrade = 'C';
      else if (percentage >= 50) newGrade = 'D';
      setGrade(newGrade);
    } else {
      setGrade('N/A');
    }
  }, [scores, questions]);

  const handleScoreChange = (id: string, value: number) => {
    setScores(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!selectedModel || !user) {
      alert(t('notifications.loginRequired'));
      return;
    }
    setIsSaving(true);
    const maxScore = questions.reduce((sum, q) => sum + q.maxScore, 0);

    try {
      const response = await fetch('/api/evaluation/ethics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel,
          category: 'accountability',
          score: totalScore,
          grade,
          feedback,
          scores, // Save individual scores as well
        }),
      });

      if (response.ok) {
        alert(t('notifications.saveSuccess'));
      } else {
        const errorData = await response.json();
        alert(`${t('notifications.saveFail')}: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert(t('notifications.saveFail'));
    } finally {
      setIsSaving(false);
    }
  };

  const maxTotalScore = questions.reduce((sum, q) => sum + q.maxScore, 0);

  return (
    <div className="bg-grey min-h-screen text-white">
      <header className="bg-white/80 backdrop-blur-sm border-b border-tan/50 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/governance-framework/evaluations/ai-ethics')}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-grey border border-tan/50 rounded-lg hover:bg-tan"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              ← AI 윤리 평가
            </button>
            <h1 className="text-xl font-bold text-green">{t('accountability.title')}</h1>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-grey border border-tan/50 rounded-md px-3 py-1.5 text-white"
              disabled={isLoading}
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
          <p className="text-white">Loading evaluation data...</p>
        </div>
      ) : (
        <main className="py-8">
          <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
            <div className="bg-white/10 rounded-2xl shadow-lg border border-tan/30 p-8 space-y-8">
              
              {/* Overview Section */}
              <div>
                <h2 className="text-2xl font-bold text-green mb-3">{t('accountability.overview')}</h2>
                <p className="text-white/80">{t('accountability.overviewDescription')}</p>
              </div>

              {/* Evaluation Items */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-green border-b border-tan/50 pb-2">{t('책임성 평가지표')}</h3>
                {questions.map((item) => (
                  <div key={item.id} className="border border-tan/30 rounded-lg p-6 bg-grey/50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-white mb-2">{item.question}</h4>
                        <p className="text-sm text-white/70">{item.description}</p>
                      </div>
                      <div className="ml-4 text-right flex-shrink-0">
                        <div className="text-lg font-semibold text-green">
                          {scores[item.id] || 0} / {item.maxScore}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <input
                        type="range"
                        min="0"
                        max={item.maxScore}
                        value={scores[item.id] || 0}
                        onChange={(e) => handleScoreChange(item.id, parseInt(e.target.value))}
                        className="w-full h-2 bg-tan/50 rounded-lg appearance-none cursor-pointer accent-green"
                        disabled={!selectedModel}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Results and Feedback */}
              <div>
                <h3 className="text-xl font-semibold text-green border-b border-tan/50 pb-2 mb-4">{t('accountability.evaluationResult')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-grey rounded-lg p-5 text-center shadow-sm border border-tan/50">
                    <div className="text-3xl font-bold text-green">{totalScore} / {maxTotalScore}</div>
                    <div className="text-sm text-white mt-1">{t('common.totalScore')}</div>
                  </div>
                  <div className="bg-grey rounded-lg p-5 text-center shadow-sm border border-tan/50">
                    <div className="text-3xl font-bold text-green">{grade}</div>
                    <div className="text-sm text-white mt-1">{t('common.grade')}</div>
                  </div>
                   <div className="bg-grey rounded-lg p-5 text-center shadow-sm border border-tan/50">
                    <div className="text-3xl font-bold text-green">
                      {maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0}%
                    </div>
                    <div className="text-sm text-white mt-1">{t('accountability.achievementRate')}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green mb-2">{t('common.feedback')}</h4>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full bg-grey border border-tan/50 rounded-md p-3 text-white focus:ring-green focus:border-green"
                    placeholder={t('common.feedbackPlaceholder')}
                    rows={4}
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !selectedModel}
                  className="bg-green text-white font-bold py-2.5 px-6 rounded-lg hover:bg-green-dark transition-colors disabled:bg-grey/50 disabled:cursor-not-allowed"
                >
                  {isSaving ? t('common.saving') : t('common.save')}
                </button>
                <button
                  onClick={() => router.push('/governance-framework/evaluations/ai-ethics/data-privacy')}
                  className="bg-orange text-white font-bold py-2.5 px-6 rounded-lg hover:bg-orange-dark transition-colors"
                >
                  다음으로 →
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
} 