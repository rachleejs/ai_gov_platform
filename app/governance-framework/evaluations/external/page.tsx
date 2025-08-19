'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlayIcon, ClockIcon, CheckCircleIcon, CogIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/contexts/AuthContext';
import { ModelSelect } from '@/app/components/ModelSelect';
import { broadcastEvaluationUpdate } from '@/lib/evaluation-sync';

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
  provider?: string;
  model_type?: string;
  is_active?: boolean;
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
    color: 'bg-red-100 text-red-800',
    url: 'https://github.com/openai/evals',
    evalMethod: 'JSON 템플릿 기반으로 문제 제시 → 모델 답변 수집 → 정답 비교',
    status: '스마트 평가',
    installCmd: 'pip3 install evals',
    requirements: 'Python 3.8+, OpenAI API 키',
    cost: '기본 프레임워크 무료, API 사용 시 비용 발생'
  },
  'huggingface-evaluate': {
    name: 'Hugging Face Evaluate',
    description: '200+ 검증된 평가 지표 라이브러리',
    icon: '🤗',
    color: 'bg-yellow-100 text-yellow-800',
    url: 'https://huggingface.co/docs/evaluate',
    evalMethod: 'BLEU, ROUGE, BERTScore 등 메트릭으로 텍스트 품질 정량 측정',
    status: '실제 평가',
    installCmd: 'pip3 install evaluate transformers datasets',
    requirements: 'Python 3.7+',
    cost: '완전 무료'
  },
  'lm-eval-harness': {
    name: 'LM Evaluation Harness',
    description: 'EleutherAI의 대규모 언어모델 평가 도구',
    icon: '⚡',
    color: 'bg-blue-100 text-blue-800',
    url: 'https://github.com/EleutherAI/lm-evaluation-harness',
    evalMethod: '다양한 NLP 태스크를 배치로 실행하고 점수 자동 집계',
    status: '스마트 평가',
    installCmd: 'pip3 install lm-eval',
    requirements: 'Python 3.8+, 일부 평가는 GPU 필요',
    cost: '무료'
  },
  'big-bench': {
    name: 'BIG-bench',
    description: 'Google의 Beyond the Imitation Game 벤치마크',
    icon: '🧠',
    color: 'bg-purple-100 text-purple-800',
    url: 'https://github.com/google/BIG-bench',
    evalMethod: '200+ 태스크로 추론, 상식, 수학 등 복합적 AI 능력 종합 평가',
    status: '스마트 평가',
    installCmd: 'pip3 install bigbench',
    requirements: 'Python 3.7+',
    cost: '무료'
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
  const [isInstalled, setIsInstalled] = useState(false);
  const [installationStatus, setInstallationStatus] = useState<string>('');
  const [showInstallModal, setShowInstallModal] = useState(false);

  // 외부 평가 프레임워크와 모델 목록 불러오기
  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching external framework evaluations, models, and status...');
        const [evaluationsRes, modelsRes, statusRes] = await Promise.all([
          fetch('/api/evaluation/external-frameworks'),
          fetch('/api/models'),
          fetch('/api/external-frameworks/status')
        ]);
        
        // 설치 상태 확인
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          console.log('External frameworks status:', statusData);
          setIsInstalled(statusData.isInstalled || false);
          setInstallationStatus(statusData.status || '');
        } else {
          console.warn('Failed to get external frameworks status, checking localStorage');
          // 로컬 스토리지에서 설치 상태 확인
          const storedStatus = localStorage.getItem('external-frameworks-installed');
          if (storedStatus === 'true') {
            setIsInstalled(true);
            setInstallationStatus('설치되었습니다. 사용 가능합니다.');
          }
        }
        
        if (evaluationsRes.ok) {
          const evaluationsData = await evaluationsRes.json();
          console.log('Fetched evaluations:', evaluationsData);
          setEvaluations(evaluationsData.availableEvaluations || []);
        } else {
          console.warn('Failed to fetch evaluations, using defaults');
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
          console.log('Fetched models data:', modelsData);
          const modelArray = Array.isArray(modelsData) ? modelsData : (modelsData.models || []);
          console.log('Using models:', modelArray);
          if (modelArray.length === 0) {
            console.warn('WARNING: No models found in database');
            setError('데이터베이스에 모델이 없습니다. 모델을 추가해주세요.');
          }
          setModels(modelArray);
        } else {
          console.error('Failed to fetch models data');
          setError('모델 데이터를 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError('데이터를 불러오는 데 실패했습니다. 시뮬레이션 모드로 동작합니다.');
      }
    }
    
    fetchData();
    
    // 필요시에만 모델 목록 재로드 (interval 제거)
    return () => {
      // cleanup function (빈 함수)
    };
  }, []);

  // 기본 모델 설정
  useEffect(() => {
    // If no models are loaded, set default models
    if (models.length === 0) {
      console.log('No models loaded, setting default models');
      // Use the same default models as in the API
      setModels([
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', model_type: 'LLM', is_active: true },
        { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', model_type: 'LLM', is_active: true },
        { id: 'gemini-2-flash', name: 'Gemini 2 Flash', provider: 'Google', model_type: 'LLM', is_active: true }
      ]);
    }
    
    // 설치 여부 확인 (localStorage에서)
    const storedStatus = localStorage.getItem('external-frameworks-installed');
    if (storedStatus === 'true') {
      console.log('External frameworks already installed');
      setIsInstalled(true);
      setInstallationStatus('설치되었습니다. 사용 가능합니다.');
    } else {
      // 처음 사용자는 미설치 상태
      console.log('External frameworks not installed');
      setIsInstalled(false);
      // 처음에는 설치 필요 화면 표시
      setIsSetupRequired(true);
    }
    
  }, [models]);

  // 프레임워크별 평가 목록 필터링
  const filteredEvaluations = selectedFramework === 'all' 
    ? evaluations 
    : evaluations.filter(evaluation => evaluation.framework === selectedFramework);

  

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
        setIsInstalled(true);
        setInstallationStatus('설치되었습니다. 사용 가능합니다.');
        localStorage.setItem('external-frameworks-installed', 'true');
        setShowInstallModal(true);
        setMessage('');
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

  // 평가 실행 함수 (실제 프레임워크 사용)
  const handleEvaluateModel = async () => {
    console.log('handleEvaluateModel called', { selectedEvaluation, selectedModel });
    
    // 로그인 체크
    if (!user) {
      console.error('User not logged in');
      setError('평가를 실행하려면 로그인이 필요합니다.');
      return;
    }
    
    if (!selectedEvaluation || !selectedModel) {
      console.error('Missing evaluation or model selection');
      setError('평가와 모델을 선택해주세요.');
      return;
    }

    const evaluation = evaluations.find(e => e.id === selectedEvaluation);
    if (!evaluation) {
      console.error('Selected evaluation not found', { selectedEvaluation, evaluations });
      setError('선택한 평가를 찾을 수 없습니다.');
      return;
    }
    
    console.log('Starting evaluation:', { 
      framework: evaluation.framework, 
      modelId: selectedModel,
      evaluationId: selectedEvaluation
    });

    setIsLoading(true);
    setMessage('평가가 진행 중입니다. 최대 30초까지 소요될 수 있습니다...');
    setError('');

    try {
      console.log('Sending evaluation request...');
      const requestBody = {
        framework: evaluation.framework,
        modelId: selectedModel,
        evaluationId: selectedEvaluation,
        options: {
          maxSamples: 5 // 테스트용으로 적은 샘플 수
        }
      };
      
      console.log('Request body:', requestBody);
      
      // 설치된 프레임워크가 있으면 Python 브리지 사용, 없으면 시뮬레이션 API 사용
      const apiEndpoint = isInstalled 
        ? '/api/python-bridge' 
        : '/api/evaluation/external-frameworks';
      
      console.log(`Using API endpoint: ${apiEndpoint}`);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Evaluation response:', { status: response.status, data });

      if (response.ok && data.success) {
        const result: EvaluationResult = {
          ...data.data,
          timestamp: new Date(data.data.timestamp)
        };
        console.log('Evaluation successful, adding result:', result);
        setResults([result, ...results]);
        
        // 평가 타입 판별 (실제 평가, 향상된 fallback, 기본 fallback)
        let evaluationType = '';
        if (result.details?.actualEvaluation) {
          evaluationType = ' (실제 평가)';
        } else if (result.details?.enhancedFallback) {
          evaluationType = ' (스마트 평가)';
        } else if (result.details?.fallback) {
          evaluationType = ' (기본 평가)';
        } else if (result.details?.simulation) {
          evaluationType = ' (시뮬레이션)';
        }
        // 평가 완료 브로드캐스트
        try {
          broadcastEvaluationUpdate(selectedModel, 'external', {
            score: result.score,
            framework: evaluation.framework,
            evaluationName: evaluation.name
          });
          console.log('📡 외부 프레임워크 평가 완료 브로드캐스트 전송:', selectedModel);
        } catch (broadcastError) {
          console.error('브로드캐스트 오류:', broadcastError);
        }
        
        setMessage(`${evaluation.name} 평가가 완료되었습니다! 점수: ${result.score}점${evaluationType}`);
        setSelectedEvaluation('');
        setSelectedModel('');
      } else {
        console.error('Evaluation failed:', data.error);
        setError(data.error || '외부 프레임워크 평가 실행에 실패했습니다.');
      }
    } catch (err) {
      console.error('Exception during evaluation:', err);
      setError('평가 실행 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      console.log('Evaluation process completed');
    }
  };

  if (isSetupRequired) {
    return (
      <div className="bg-grey min-h-screen">
        <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.push('/add-custom')}
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
            onClick={() => router.push('/add-custom')}
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

        </div>

                 {user?.isGuest && (
           <div className="mb-6 p-4 bg-yellow-100/50 border border-yellow-300/50 rounded-lg text-sm text-yellow-800 text-center">
             ⚠️ 게스트 모드에서는 평가를 실행할 수 있지만 결과가 저장되지 않습니다. 결과 저장을 원하시면 회원가입이 필요합니다.
           </div>
         )}

        {message && <div className="mb-6 p-3 bg-green-100/50 border border-green-300/50 rounded-lg text-green-800 text-sm text-center">{message}</div>}
        {error && <div className="mb-6 p-3 bg-red-100/50 border border-red-300/50 rounded-lg text-red-800 text-sm text-center">{error}</div>}

        <div className="grid grid-cols-1 gap-8">
          {/* 평가 설정 패널 - 전체 너비로 확장 */}
          <div className="w-full">
            <div className="bg-transparent border-4 border-orange p-8 rounded-xl shadow-lg mb-6">
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-green mb-2">평가 선택</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[200px]">
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
                <ModelSelect
                  value={selectedModel}
                  onChange={(modelId) => setSelectedModel(modelId)}
                  label="AI 모델"
                  showAdvanced={false}
                />
              </div>

              {/* 실행 버튼 */}
              <div className="mb-6">
                <button
                  onClick={handleEvaluateModel}
                  disabled={!selectedEvaluation || !selectedModel || isLoading}
                  className={`w-full flex items-center justify-center px-4 py-3 text-white font-semibold rounded-lg transition-colors border border-orange ${
                    isLoading 
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:bg-taupe/50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <>
                      <ClockIcon className="w-5 h-5 mr-2 animate-spin" />
                      평가 중...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 mr-2 text-orange " />
                      모델 평가하기
                    </>
                  )}
                </button>
              </div>
               
               {/* 프레임워크 설치 버튼 - 설치되지 않은 경우만 표시 */}
               {!isInstalled && (
                 <div className="pt-4 border-t border-orange">
                   <p className="text-sm text-white mb-3">실제 프레임워크 사용을 원하시나요?</p>
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
               )}
             </div>
           </div>

          
          {/* 최근 평가 결과 패널 - 아래쪽으로 이동 */}
          <div className="w-full">
            <div className="bg-transparent border-4 border-orange p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-green mb-4">최근 평가 결과</h3>
              
              {results.length === 0 ? (
                <p className="text-sm text-white text-center py-8">
                  아직 평가 결과가 없습니다.<br />
                  위에서 평가를 시작해보세요.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.slice(0, 6).map((result, index) => {
                    const frameworkDetails = frameworkInfo[result.framework as keyof typeof frameworkInfo];
                    return (
                      <div key={index} className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-orange">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white text-sm">{result.evaluationId}</h4>
                          <CheckCircleIcon className="w-4 h-4 text-green" />
                        </div>
                        {frameworkDetails && (
                          <div className="text-xs text-gray-300 mb-2">
                            <span className={`px-2 py-1 rounded-full ${frameworkDetails?.color}`}>
                              {frameworkDetails?.icon} {frameworkDetails?.name}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-gray-300 mb-2">
                          점수: <span className="font-semibold text-white">{result.score}</span>
                          {result.details?.actualEvaluation ? (
                            <span className="ml-1 text-green-400">(실제 평가)</span>
                          ) : result.details?.enhancedFallback ? (
                            <span className="ml-1 text-blue-400">(스마트 평가)</span>
                          ) : result.details?.fallback ? (
                            <span className="ml-1 text-orange-400">(기본 평가)</span>
                          ) : result.details?.simulation ? (
                            <span className="ml-1 text-gray-400">(시뮬레이션)</span>
                          ) : result.details?.evaluation ? (
                            <span className="ml-1 text-purple-400">(모델 평가)</span>
                          ) : null}
                        </div>
                        <div className="text-xs text-gray-400">
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
        {/* 프레임워크 설치 안내서 */}
    
        
        <div className="mt-6 bg-transparent border-4 border-orange p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-green mb-4">지원하는 평가 프레임워크</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(frameworkInfo).map(([key, info]) => (
              <div key={key} className="p-4 bg-white/10 backdrop-blur-sm border border-orange rounded-lg">
                <div className="text-center mb-3">
                  <div className="text-3xl mb-2">{info.icon}</div>
                  <h4 className="font-medium text-white mb-1">{info.name}</h4>
                  <div className="flex justify-center mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      info.status === '실제 평가' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    }`}>
                      {info.status}
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-300 mb-2">{info.description}</p>
                  <div className="mb-2">
                    <p className="text-xs font-medium text-white mb-1">평가 방식:</p>
                    <p className="text-xs text-gray-300">{info.evalMethod}</p>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-gray-700/30">
                    <p className="text-xs font-medium text-white mb-1">설치 요구사항:</p>
                    <p className="text-xs text-gray-300 mb-1">{info.requirements}</p>
                    <p className="text-xs text-gray-300 mb-2">비용: {info.cost}</p>
                    
                    <div className="bg-black/30 p-2 rounded mb-2 font-mono text-xs text-gray-300 overflow-x-auto">
                      {info.installCmd}
                    </div>
                  </div>
                  
                  <a 
                    href={info.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-orange-400 hover:text-orange-300 hover:underline"
                  >
                    공식 문서 →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 설치 완료 모달 */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 text-center">
            <div className="text-green-600 text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">설치 완료!</h3>
            <p className="text-gray-600 mb-4">
              외부 프레임워크가 성공적으로 설치되었습니다.<br />
              이제 사용 가능합니다.
            </p>
            <button
              onClick={() => setShowInstallModal(false)}
              className="px-6 py-2 bg-transparent text-lime border border-lime rounded-lg hover:bg-green-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 