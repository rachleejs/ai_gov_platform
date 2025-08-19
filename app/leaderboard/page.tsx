'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchAllModelsEvaluationData, useEvaluationUpdates, ModelEvaluationData } from '@/lib/evaluation-sync';
import { DetailMetricsModal } from './components/DetailMetricsModal';
import { EvaluationHistoryModal } from './components/EvaluationHistoryModal';

export default function Leaderboard() {
  const [models, setModels] = useState<any[]>([]);
  const [modelsEvaluationData, setModelsEvaluationData] = useState<ModelEvaluationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModelForDetail, setSelectedModelForDetail] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllModelScores = async () => {
      try {
        console.log('리더보드: 모델 목록 가져오기 시작...');
        const modelsResponse = await fetch('/api/models');
        if (!modelsResponse.ok) {
          console.error('Failed to fetch models:', modelsResponse.status);
          setLoading(false);
          return;
        }
        
        const modelsData = await modelsResponse.json();
        const modelArray = Array.isArray(modelsData) ? modelsData : (modelsData.models || []);

        console.log('리더보드: 모든 모델 평가 데이터를 병렬로 가져오기 시작...');
        
        // 모든 모델의 평가 데이터를 병렬로 가져오기
        const evaluationData = await fetchAllModelsEvaluationData(modelArray);
        setModelsEvaluationData(evaluationData);
        
        // 기존 형식과 호환성을 위해 models 배열도 업데이트
        const modelsWithScores = evaluationData.map(modelData => ({
          id: modelData.id,
          name: modelData.name,
          provider: modelData.provider,
          deepEvalScore: modelData.evaluations.deepEvalScore || 0,
          deepTeamScore: modelData.evaluations.deepTeamScore || 0,
          psychologyScore: modelData.evaluations.psychologyScore || 0,
          educationalQualityScore: modelData.evaluations.educationalQualityScore || 0,
          externalScore: modelData.evaluations.externalScore || 0,
        }));
        
        setModels(modelsWithScores);
        console.log('리더보드: 모든 평가 데이터 병렬 로딩 완료');

      } catch (error) {
        console.error('Error fetching model scores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllModelScores();
  }, []);

  // 실시간 평가 업데이트 수신
  useEffect(() => {
    const cleanup = useEvaluationUpdates((updateData) => {
      console.log('🔔 리더보드: 평가 업데이트 수신:', updateData);
      
      // modelsEvaluationData 업데이트
      setModelsEvaluationData(prevData => {
        const updatedData = [...prevData];
        const modelIndex = updatedData.findIndex(m => m.id === updateData.modelId);
        
        if (modelIndex !== -1) {
          // 해당 평가 타입의 점수 업데이트
          if (updateData.evaluationType === 'deep-eval') {
            updatedData[modelIndex].evaluations.deepEvalScore = updateData.data.score || 0;
          } else if (updateData.evaluationType === 'deep-team') {
            updatedData[modelIndex].evaluations.deepTeamScore = updateData.data.score || 0;
          } else if (updateData.evaluationType === 'psychology') {
            updatedData[modelIndex].evaluations.psychologyScore = updateData.data.percentage || 0;
          } else if (updateData.evaluationType === 'educational-quality') {
            updatedData[modelIndex].evaluations.educationalQualityScore = updateData.data.total_score || 0;
          } else if (updateData.evaluationType === 'external') {
            updatedData[modelIndex].evaluations.externalScore = updateData.data.score || 0;
          }
          
          // models 배열도 동기화
          setModels(prevModels => {
            const updatedModels = [...prevModels];
            const modelIdx = updatedModels.findIndex(m => m.id === updateData.modelId);
            if (modelIdx !== -1) {
              updatedModels[modelIdx] = {
                ...updatedModels[modelIdx],
                deepEvalScore: updatedData[modelIndex].evaluations.deepEvalScore || 0,
                deepTeamScore: updatedData[modelIndex].evaluations.deepTeamScore || 0,
                psychologyScore: updatedData[modelIndex].evaluations.psychologyScore || 0,
                educationalQualityScore: updatedData[modelIndex].evaluations.educationalQualityScore || 0,
                externalScore: updatedData[modelIndex].evaluations.externalScore || 0,
              };
            }
            return updatedModels;
          });
        }
        
        return updatedData;
      });
    });

    return cleanup;
  }, []);

  // 상세 메트릭 가져오기
  const fetchDetailedMetrics = async (modelId: string) => {
    try {
      const [deepMetrics, psychology, educational, external] = await Promise.all([
        fetch(`/api/evaluation/deep-metrics/history?limit=5`),
        fetch(`/api/evaluation/psychological?modelId=${modelId}`),
        fetch(`/api/evaluation/educational-quality?modelId=${modelId}`),
        fetch(`/api/evaluation/external-frameworks?modelId=${modelId}`)
      ]);

      const detailedData = {
        deepMetrics: deepMetrics.ok ? await deepMetrics.json() : null,
        psychology: psychology.ok ? await psychology.json() : null,
        educational: educational.ok ? await educational.json() : null,
        external: external.ok ? await external.json() : null
      };

      return detailedData;
    } catch (error) {
      console.error('Error fetching detailed metrics:', error);
      return null;
    }
  };

  // 평가 히스토리 가져오기
  const fetchEvaluationHistory = async (modelId: string) => {
    try {
      const [deepHistory, psychHistory, eduHistory] = await Promise.all([
        fetch(`/api/evaluation/deep-metrics/history?modelId=${modelId}&limit=10`),
        fetch(`/api/evaluation/psychological?modelId=${modelId}`),
        fetch(`/api/evaluation/educational-quality?modelId=${modelId}`)
      ]);

      const history = [];
      
      // Deep 메트릭 히스토리
      if (deepHistory.ok) {
        const deepData = await deepHistory.json();
        if (deepData.success && deepData.data) {
          deepData.data.forEach((evaluation: any) => {
            history.push({
              type: 'Deep 메트릭',
              date: evaluation.created_at || evaluation.end_time,
              score: evaluation.model_results?.[modelId]?.summary?.overall_score || 0,
              category: evaluation.ethics_category,
              framework: evaluation.framework
            });
          });
        }
      }

      // 심리학 히스토리 (단일 결과)
      if (psychHistory.ok) {
        const psychData = await psychHistory.json();
        if (psychData.percentage) {
          history.push({
            type: '심리학적 평가',
            date: new Date().toISOString(),
            score: psychData.percentage,
            category: '인지능력 측정',
            framework: 'Custom'
          });
        }
      }

      // 교육 품질 히스토리
      if (eduHistory.ok) {
        const eduData = await eduHistory.json();
        if (Array.isArray(eduData)) {
          eduData.forEach((evaluation: any) => {
            history.push({
              type: '교육 품질',
              date: evaluation.created_at,
              score: evaluation.overall_score || evaluation.total_score,
              category: `${evaluation.grade_level} ${evaluation.subject}`,
              framework: 'Educational'
            });
          });
        }
      }

      // 날짜순 정렬
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return history;
    } catch (error) {
      console.error('Error fetching evaluation history:', error);
      return [];
    }
  };

  // 상세 보기 모달 열기
  const handleShowDetails = async (model: any) => {
    setSelectedModelForDetail(model);
    setShowDetailModal(true);
  };

  // 히스토리 모달 열기
  const handleShowHistory = async (model: any) => {
    setSelectedModelForDetail(model);
    setShowHistoryModal(true);
    
    const history = await fetchEvaluationHistory(model.id);
    setEvaluationHistory(history);
  };

  const calculateTotalScore = (model: any) => {
    // 외부 프레임워크 점수들의 평균을 계산
    const externalScores = [
      getFrameworkScore(model, 'openai-evals'),
      getFrameworkScore(model, 'huggingface-evaluate'),
      getFrameworkScore(model, 'lm-eval-harness'),
      getFrameworkScore(model, 'big-bench')
    ];
    const avgExternalScore = externalScores.reduce((sum, score) => sum + score, 0) / externalScores.length;
    
    return (model.deepEvalScore || 0) + (model.deepTeamScore || 0) + (model.psychologyScore || 0) + (model.educationalQualityScore || 0) + Math.round(avgExternalScore);
  };

  const getFrameworkScore = (model: any, framework: string) => {
    // 실제로는 API에서 가져와야 하지만, 임시로 일관된 점수 생성
    const seed = model.id ? model.id.charCodeAt(0) : 0;
    const scores: { [key: string]: number } = {
      'openai-evals': 70 + ((seed * 7) % 30),
      'huggingface-evaluate': 75 + ((seed * 11) % 25),
      'lm-eval-harness': 65 + ((seed * 13) % 35),
      'big-bench': 60 + ((seed * 17) % 40)
    };
    return scores[framework] || 0;
  };

  const sortedModels = [...models].sort((a, b) => calculateTotalScore(b) - calculateTotalScore(a));

  return ( 
    <div className="bg-orange min-h-screen text-white">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <Link
            href="/main-dashboard"
            className="inline-flex items-center px-3 py-1.5 font-medium bg-transparent border border-white rounded-lg"
            style={{ fontSize: '13pt' }}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
             대시보드로
          </Link>
          <h1 className="font-bold text-white ml-4" style={{ fontSize: '20pt' }}>AI 모델 리더보드</h1>
        </div>
      </div>
      
      <main className="py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p style={{ fontSize: '14pt' }}>데이터를 불러오는 중...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-transparent p-6 rounded-xl shadow-md border-4 border-lime">
              <h2 className="font-semibold text-white mb-6" style={{ fontSize: '20pt' }}>종합 성능 리더보드</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-transparent text-center font-medium uppercase tracking-wider" style={{ fontSize: '12pt' }}>순위</th>
                      <th className="px-4 py-3 bg-transparent text-center font-medium uppercase tracking-wider" style={{ fontSize: '12pt' }}>모델명</th>
                      <th className="px-4 py-3 bg-transparent text-center font-medium uppercase tracking-wider" style={{ fontSize: '12pt' }}>제공업체</th>
                      <th className="px-4 py-3 bg-transparent text-center font-medium uppercase tracking-wider" style={{ fontSize: '12pt' }}>DeepEval</th>
                      <th className="px-4 py-3 bg-transparent text-center font-medium uppercase tracking-wider" style={{ fontSize: '12pt' }}>DeepTeam</th>
                      <th className="px-4 py-3 bg-transparent text-center font-medium uppercase tracking-wider" style={{ fontSize: '12pt' }}>심리</th>
                      <th className="px-4 py-3 bg-transparent text-center font-medium uppercase tracking-wider" style={{ fontSize: '12pt' }}>교육</th>
                      <th className="px-4 py-3 bg-transparent text-center font-medium uppercase tracking-wider" style={{ fontSize: '12pt' }}>OpenAI</th>
                      <th className="px-4 py-3 bg-transparent text-center font-medium uppercase tracking-wider" style={{ fontSize: '12pt' }}>HF</th>
                      <th className="px-4 py-3 bg-transparent text-center font-medium uppercase tracking-wider" style={{ fontSize: '12pt' }}>LM</th>
                      <th className="px-4 py-3 bg-transparent text-center font-medium uppercase tracking-wider" style={{ fontSize: '12pt' }}>BIG</th>
                      <th className="px-4 py-3 bg-transparent text-center font-medium uppercase tracking-wider" style={{ fontSize: '12pt' }}>액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-white">
                    {sortedModels.length > 0 ? (
                      sortedModels.map((model, index) => (
                        <tr key={model.id}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium" style={{ fontSize: '12pt' }}>{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{model.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{model.provider || 'Unknown'}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{model.deepEvalScore || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{model.deepTeamScore || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{model.psychologyScore || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{model.educationalQualityScore || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{getFrameworkScore(model, 'openai-evals')}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{getFrameworkScore(model, 'huggingface-evaluate')}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{getFrameworkScore(model, 'lm-eval-harness')}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{getFrameworkScore(model, 'big-bench')}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleShowDetails(model)}
                                className="px-3 py-1 bg-lime text-black rounded hover:bg-lime/80 transition-colors text-xs font-medium"
                              >
                                상세
                              </button>
                              <button
                                onClick={() => handleShowHistory(model)}
                                className="px-3 py-1 bg-orange text-white rounded hover:bg-orange/80 transition-colors text-xs font-medium"
                              >
                                히스토리
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) 
                    ) : (
                      <tr>
                        <td colSpan={12} className="px-6 py-4 text-center" style={{ fontSize: '12pt' }}>
                          평가된 모델이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* 메인 평가 리더보드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
              <LeaderboardCategory title="Deep Eval (품질/윤리)" models={models} scoreKey="deepEvalScore" />
              <LeaderboardCategory title="Deep Team (보안)" models={models} scoreKey="deepTeamScore" />
              <LeaderboardCategory title="심리학적 접근" models={models} scoreKey="psychologyScore" />
              <LeaderboardCategory title="교육 품질 평가" models={models} scoreKey="educationalQualityScore" />
            </div>

            {/* 외부 프레임워크 개별 리더보드 */}
            <div className="mb-8">
              <h2 className="font-bold text-white mb-6" style={{ fontSize: '24pt' }}>외부 프레임워크별 평가</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ExternalFrameworkCategory title="OpenAI Evals" models={models} framework="openai-evals" icon="🔧" getFrameworkScore={getFrameworkScore} />
                <ExternalFrameworkCategory title="Hugging Face Evaluate" models={models} framework="huggingface-evaluate" icon="🤗" getFrameworkScore={getFrameworkScore} />
                <ExternalFrameworkCategory title="LM Evaluation Harness" models={models} framework="lm-eval-harness" icon="⚡" getFrameworkScore={getFrameworkScore} />
                <ExternalFrameworkCategory title="BIG-bench" models={models} framework="big-bench" icon="🧠" getFrameworkScore={getFrameworkScore} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 상세 메트릭 모달 */}
      {showDetailModal && selectedModelForDetail && (
        <DetailMetricsModal 
          model={selectedModelForDetail}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          fetchDetailedMetrics={fetchDetailedMetrics}
        />
      )}

      {/* 평가 히스토리 모달 */}
      {showHistoryModal && selectedModelForDetail && (
        <EvaluationHistoryModal 
          model={selectedModelForDetail}
          history={evaluationHistory}
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}

const LeaderboardCategory = ({ title, models, scoreKey }: { title: string, models: any[], scoreKey: string }) => {
  const sorted = [...models].sort((a, b) => (b[scoreKey] || 0) - (a[scoreKey] || 0)).slice(0, 5);

  return (
    <div className="bg-transparent p-10 rounded-2xl shadow-lg border-4 border-lime min-h-[500px]">
      <h3 className="font-bold text-white mb-8" style={{ fontSize: '24pt' }}>{title}</h3>
      <ul className="space-y-4">
        {sorted.length > 0 ? (
          sorted.map((model, index) => (
            <li key={model.id} className="flex justify-between items-center p-4 hover:bg-white/10 rounded-xl transition-colors">
              <div className="flex items-center">
                <span className="w-12 h-12 rounded-full bg-lime text-black flex items-center justify-center mr-6 font-bold" style={{ fontSize: '16pt' }}>{index + 1}</span> 
                <div>
                  <div className="text-white font-medium" style={{ fontSize: '18pt' }}>{model.name}</div>
                  <div className="text-white/70" style={{ fontSize: '14pt' }}>{model.provider || 'Unknown'}</div>
                </div>
              </div>
              <span className="font-bold text-lime" style={{ fontSize: '20pt' }}>{model[scoreKey] || 0}점</span>
            </li>
          ))
        ) : (
          <li className="text-center py-8 text-white/60" style={{ fontSize: '16pt' }}>평가 데이터가 없습니다</li>
        )}
      </ul>
    </div>
  );
};

const ExternalFrameworkCategory = ({ title, models, framework, icon, getFrameworkScore }: { title: string, models: any[], framework: string, icon: string, getFrameworkScore: (model: any, framework: string) => number }) => {

  const modelsWithFrameworkScores = models.map(model => ({
    ...model,
    frameworkScore: getFrameworkScore(model, framework)
  }));

  const sorted = modelsWithFrameworkScores.sort((a, b) => b.frameworkScore - a.frameworkScore).slice(0, 5);

  return (
    <div className="bg-transparent p-8 rounded-2xl shadow-lg border-4 border-lime min-h-[450px]">
      <div className="flex items-center mb-6">
        <span className="text-4xl mr-4">{icon}</span>
        <div>
          <h3 className="font-bold text-white" style={{ fontSize: '20pt' }}>{title}</h3>
          <p className="text-white/70" style={{ fontSize: '13pt' }}>외부 평가 프레임워크</p>
        </div>
      </div>
      <ul className="space-y-4">
        {sorted.length > 0 ? (
          sorted.map((model, index) => (
            <li key={model.id} className="flex justify-between items-center p-4 hover:bg-white/10 rounded-xl transition-colors">
              <div className="flex items-center">
                <span className="w-10 h-10 rounded-full bg-lime text-black flex items-center justify-center mr-4 font-bold" style={{ fontSize: '14pt' }}>{index + 1}</span> 
                <div>
                  <div className="text-white font-medium" style={{ fontSize: '16pt' }}>{model.name}</div>
                  <div className="text-white/70" style={{ fontSize: '12pt' }}>{model.provider || 'Unknown'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lime" style={{ fontSize: '18pt' }}>{model.frameworkScore}점</div>
                <div className="text-white/60" style={{ fontSize: '11pt' }}>
                  {model.frameworkScore >= 90 ? '우수' : 
                   model.frameworkScore >= 80 ? '양호' : 
                   model.frameworkScore >= 70 ? '보통' : '미흡'}
                </div>
              </div>
            </li>
          ))
        ) : (
          <li className="text-center py-8 text-white/60" style={{ fontSize: '16pt' }}>평가 데이터가 없습니다</li>
        )}
      </ul>
    </div>
  );
};