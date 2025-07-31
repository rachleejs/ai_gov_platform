'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlayIcon, ClockIcon, CheckCircleIcon, CogIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface ExternalEvaluation {
  id: string;
  name: string;
  description: string;
  framework: string;
  category: string;
}

interface Model {
  id: string;
  name: string;
  description?: string;
}

interface EvaluationResult {
  framework: string;
  evaluationId: string;
  modelId: string;
  score: number;
  details: any;
  timestamp: Date;
}

const frameworkInfo = {
  'openai-evals': {
    name: 'OpenAI Evals',
    description: 'OpenAI에서 공식 제공하는 평가 프레임워크',
    icon: '🔧',
    color: 'bg-green-100 text-green-800',
    url: 'https://github.com/openai/evals'
  },
  'huggingface-evaluate': {
    name: 'Hugging Face Evaluate',
    description: '200+ 검증된 평가 지표 라이브러리',
    icon: '🤗',
    color: 'bg-yellow-100 text-yellow-800',
    url: 'https://huggingface.co/docs/evaluate'
  },
  'lm-eval-harness': {
    name: 'LM Evaluation Harness',
    description: 'EleutherAI의 대규모 언어모델 평가 도구',
    icon: '⚡',
    color: 'bg-blue-100 text-blue-800',
    url: 'https://github.com/EleutherAI/lm-evaluation-harness'
  },
  'big-bench': {
    name: 'BIG-bench',
    description: 'Google의 Beyond the Imitation Game 벤치마크',
    icon: '🧠',
    color: 'bg-purple-100 text-purple-800',
    url: 'https://github.com/google/BIG-bench'
  }
};

export default function ExternalEvaluationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [evaluations, setEvaluations] = useState<ExternalEvaluation[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [selectedEvaluation, setSelectedEvaluation] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  // 외부 평가 프레임워크와 모델 목록 불러오기
  useEffect(() => {
    async function fetchData() {
      try {
        const [evaluationsRes, modelsRes] = await Promise.all([
          fetch('/api/evaluation/external-frameworks'),
          fetch('/api/models'),
        ]);
        
        if (evaluationsRes.ok) {
          const evaluationsData = await evaluationsRes.json();
          setEvaluations(evaluationsData.availableEvaluations || []);
        } else {
          // API 호출 실패시 기본 평가 목록 제공 (시뮬레이션용)
          const defaultEvaluations = [
            { id: 'bleu', name: 'BLEU Score', description: '번역 품질 평가 지표', framework: 'huggingface-evaluate', category: 'translation' },
            { id: 'rouge', name: 'ROUGE Score', description: '요약 품질 평가 지표', framework: 'huggingface-evaluate', category: 'summarization' },
            { id: 'math', name: 'Mathematics', description: '수학 문제 해결 능력 평가', framework: 'openai-evals', category: 'reasoning' },
            { id: 'hellaswag', name: 'HellaSwag', description: '상식 추론 평가', framework: 'lm-eval-harness', category: 'reasoning' },
            { id: 'arithmetic', name: 'Arithmetic', description: '산술 계산 능력', framework: 'big-bench', category: 'math' }
          ];
          setEvaluations(defaultEvaluations);
        }
        
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          const modelArray = Array.isArray(modelsData) ? modelsData : (modelsData.models || []);
          setModels(modelArray);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError('데이터를 불러오는 데 실패했습니다. 시뮬레이션 모드로 동작합니다.');
      }
    }
    fetchData();
  }, []);

  // 프레임워크별 평가 목록 필터링
  const filteredEvaluations = selectedFramework === 'all' 
    ? evaluations 
    : evaluations.filter(evaluation => evaluation.framework === selectedFramework);

  // 평가 실행
  const handleRunEvaluation = async () => {
    if (!selectedEvaluation || !selectedModel) {
      setError('평가와 모델을 선택해주세요.');
      return;
    }

    const evaluation = evaluations.find(e => e.id === selectedEvaluation);
    if (!evaluation) {
      setError('선택한 평가를 찾을 수 없습니다.');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/evaluation/external-frameworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework: evaluation.framework,
          modelId: selectedModel,
          evaluationId: selectedEvaluation,
          options: {
            maxSamples: 5 // 테스트용으로 적은 샘플 수
          }
        }),
      });

      const data = await response.json();

             if (response.ok && data.success) {
         const result: EvaluationResult = {
           ...data.data,
           timestamp: new Date(data.data.timestamp)
         };
         setResults([result, ...results]);
         // Hugging Face는 실제 평가, 다른 프레임워크는 시뮬레이션
         const isActualEvaluation = evaluation.framework === 'huggingface-evaluate';
         const evaluationType = isActualEvaluation ? ' (실제 평가)' : 
                               result.details?.simulation ? ' (시뮬레이션)' : '';
         setMessage(`${evaluation.name} 평가가 완료되었습니다! 점수: ${result.score}점${evaluationType}`);
         setSelectedEvaluation('');
         setSelectedModel('');
       } else {
        setError(data.error || '외부 프레임워크 평가 실행에 실패했습니다.');
      }
    } catch (err) {
      setError('평가 실행 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 프레임워크 설정 실행
  const handleSetupFrameworks = async () => {
    setIsLoading(true);
    setMessage('외부 프레임워크 설정 중...');
    setError('');

    try {
      const response = await fetch('/api/setup-external-frameworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('외부 프레임워크 설정이 완료되었습니다! 페이지를 새로고침해주세요.');
        setIsSetupRequired(false);
      } else {
        setError(data.error || '프레임워크 설정에 실패했습니다.');
      }
    } catch (err) {
      setError('프레임워크 설정 중 오류가 발생했습니다. 터미널에서 ./scripts/setup-external-evaluators.sh를 직접 실행해보세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSetupRequired) {
    return (
      <div className="bg-grey min-h-screen">
        <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.push('/evaluation-data')}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-grey border border-tan/50 rounded-lg hover:bg-slate-grey hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              커스텀 설정으로
            </button>
            <h1 className="text-xl font-bold text-green ml-4">외부 프레임워크 평가</h1>
          </div>
        </div>
        
        <main className="py-4 mx-auto max-w-4xl sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-tan/30 text-center">
            <CogIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">외부 프레임워크 설정 필요</h2>
            <p className="text-gray-600 mb-6">
              외부 평가 프레임워크를 사용하려면 먼저 설정이 필요합니다.<br />
              아래 버튼을 클릭하여 필요한 프레임워크들을 자동으로 설치하고 설정하세요.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(frameworkInfo).map(([key, info]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{info.icon}</span>
                    <h3 className="font-semibold text-gray-900">{info.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{info.description}</p>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleSetupFrameworks}
              disabled={isLoading}
              className={`px-6 py-3 text-white font-semibold rounded-lg transition-colors ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isLoading ? (
                <>
                  <ClockIcon className="w-5 h-5 inline mr-2 animate-spin" />
                  설정 중...
                </>
              ) : (
                '외부 프레임워크 설정 시작'
              )}
            </button>
            
            {message && <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">{message}</div>}
            {error && <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">{error}</div>}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-grey min-h-screen">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.push('/evaluation-data')}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-grey border border-tan/50 rounded-lg hover:bg-slate-grey hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            커스텀 설정으로
          </button>
          <h1 className="text-xl font-bold text-green ml-4">외부 프레임워크 평가</h1>
        </div>
      </div>
      
      <main className="py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-green mb-2">외부 평가 프레임워크</h2>
          <p className="text-white max-w-3xl mx-auto mb-4">
            검증된 외부 평가 프레임워크를 사용하여 AI 모델의 성능을 전문적으로 평가합니다.
            각 프레임워크는 특화된 영역에서 정확하고 신뢰할 수 있는 평가 결과를 제공합니다.
          </p>
          <div className="bg-green-100/50 border border-green-300/50 rounded-lg p-4 text-sm text-green-800 max-w-3xl mx-auto">
            <div className="flex items-start space-x-3">
              <span className="text-lg">🚀</span>
              <div>
                <span className="font-semibold">실제 평가 모드</span>
                <p className="mt-1">
                  Hugging Face Evaluate가 설치되어 실제 평가를 수행합니다.
                </p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• ✅ <strong>Hugging Face Evaluate</strong>: BLEU, ROUGE, BERTScore 등 실제 계산</li>
                  <li>• 🔄 <strong>OpenAI Evals, LM Eval Harness, BIG-bench</strong>: 아직 시뮬레이션</li>
                  <li>• 💡 더 많은 프레임워크 설치: <code className="bg-green-200 px-1 rounded">./scripts/setup-external-evaluators.sh</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

                 {user?.isGuest && (
           <div className="mb-6 p-4 bg-yellow-100/50 border border-yellow-300/50 rounded-lg text-sm text-yellow-800 text-center">
             ⚠️ 게스트 모드에서는 평가를 실행할 수 있지만 결과가 저장되지 않습니다. 결과 저장을 원하시면 회원가입이 필요합니다.
           </div>
         )}

        {message && <div className="mb-6 p-3 bg-green-100/50 border border-green-300/50 rounded-lg text-green-800 text-sm text-center">{message}</div>}
        {error && <div className="mb-6 p-3 bg-red-100/50 border border-red-300/50 rounded-lg text-red-800 text-sm text-center">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 평가 설정 패널 */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-tan/30 mb-6">
              <h3 className="text-lg font-semibold text-green mb-4">평가 설정</h3>
              
              {/* 프레임워크 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-green mb-2">평가 프레임워크</label>
                <select
                  value={selectedFramework}
                  onChange={(e) => {
                    setSelectedFramework(e.target.value);
                    setSelectedEvaluation('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-tan/50 rounded-lg focus:ring-green focus:border-green text-green"
                >
                  <option value="all">전체 프레임워크</option>
                  {Object.entries(frameworkInfo).map(([key, info]) => (
                    <option key={key} value={key}>{info.name}</option>
                  ))}
                </select>
              </div>

              {/* 평가 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-green mb-2">평가 선택</label>
                <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                  {filteredEvaluations.map((evaluation) => {
                    const frameworkDetails = frameworkInfo[evaluation.framework as keyof typeof frameworkInfo];
                    return (
                      <div
                        key={evaluation.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedEvaluation === evaluation.id
                            ? 'border-green bg-green/10'
                            : 'border-tan/50 hover:border-green/50'
                        }`}
                        onClick={() => setSelectedEvaluation(evaluation.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-green">{evaluation.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{frameworkDetails?.icon}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${frameworkDetails?.color}`}>
                              {frameworkDetails?.name}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">{evaluation.description}</p>
                      </div>
                    );
                  })}
                </div>
                {filteredEvaluations.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    선택한 프레임워크에 사용 가능한 평가가 없습니다.
                  </p>
                )}
              </div>

              {/* 모델 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-green mb-2">AI 모델</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-tan/50 rounded-lg focus:ring-green focus:border-green text-green"
                >
                  <option value="">모델을 선택하세요</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.description && `- ${model.description}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* 실행 버튼 */}
                             <button
                 onClick={handleRunEvaluation}
                 disabled={!selectedEvaluation || !selectedModel || isLoading}
                 className={`w-full flex items-center justify-center px-4 py-3 text-white font-semibold rounded-lg transition-colors ${
                   isLoading 
                     ? 'bg-gray-400 cursor-not-allowed'
                     : 'bg-orange-600 hover:bg-orange-700'
                 } disabled:bg-taupe/50 disabled:cursor-not-allowed`}
               >
                {isLoading ? (
                  <>
                    <ClockIcon className="w-5 h-5 mr-2 animate-spin" />
                    평가 진행 중...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5 mr-2" />
                    평가 시작
                  </>
                )}
                             </button>
               
               {/* 실제 프레임워크 설치 버튼 */}
               <div className="mt-4 pt-4 border-t border-tan/30">
                 <p className="text-sm text-green mb-2">실제 프레임워크 사용을 원하시나요?</p>
                 <button
                   onClick={handleSetupFrameworks}
                   disabled={isLoading}
                   className={`w-full flex items-center justify-center px-4 py-2 text-white font-medium rounded-lg transition-colors ${
                     isLoading 
                       ? 'bg-gray-400 cursor-not-allowed'
                       : 'bg-blue-600 hover:bg-blue-700'
                   }`}
                 >
                   {isLoading ? (
                     <>
                       <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                       프레임워크 설치 중...
                     </>
                   ) : (
                     '외부 프레임워크 설치하기'
                   )}
                 </button>
               </div>
             </div>
           </div>

          {/* 평가 결과 패널 */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-tan/30 sticky top-4">
              <h3 className="text-lg font-semibold text-green mb-4">최근 평가 결과</h3>
              
              {results.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  아직 평가 결과가 없습니다.<br />
                  위에서 평가를 시작해보세요.
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {results.slice(0, 5).map((result, index) => {
                    const frameworkDetails = frameworkInfo[result.framework as keyof typeof frameworkInfo];
                    return (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-green text-sm">{result.evaluationId}</h4>
                          <CheckCircleIcon className="w-4 h-4 text-green" />
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          <span className={`px-2 py-1 rounded-full ${frameworkDetails?.color}`}>
                            {frameworkDetails?.icon} {frameworkDetails?.name}
                          </span>
                        </div>
                                                 <div className="text-xs text-gray-600 mb-2">
                           점수: <span className="font-semibold">{result.score}</span>
                           {result.details?.framework === 'huggingface-evaluate' ? (
                             <span className="ml-1 text-green-600">(실제 평가)</span>
                           ) : result.details?.simulation ? (
                             <span className="ml-1 text-blue-600">(시뮬레이션)</span>
                           ) : null}
                         </div>
                        <div className="text-xs text-gray-500">
                          {result.timestamp.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 프레임워크 정보 섹션 */}
        <div className="mt-12 bg-white p-6 rounded-xl shadow-lg border border-tan/30">
          <h3 className="text-lg font-semibold text-green mb-4">지원하는 평가 프레임워크</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(frameworkInfo).map(([key, info]) => (
              <div key={key} className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-3xl mb-2">{info.icon}</div>
                <h4 className="font-medium text-green mb-1">{info.name}</h4>
                <p className="text-xs text-gray-600 mb-2">{info.description}</p>
                <a 
                  href={info.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  자세히 보기 →
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 