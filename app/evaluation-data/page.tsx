'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlusCircleIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

// Separate presentational components defined outside the page component to maintain stable identity across renders
interface InputFieldProps {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ id, value, onChange, placeholder, required = false }) => (
  <input
    id={id}
    type="text"
    value={value}
    onChange={onChange}
    className="w-full px-4 py-2 bg-grey border border-tan/50 rounded-lg focus:ring-green focus:border-green text-green placeholder-white"
    placeholder={placeholder}
    required={required}
  />
);

interface TextareaFieldProps {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
}

const TextareaField: React.FC<TextareaFieldProps> = ({ id, value, onChange, placeholder }) => (
  <textarea
    id={id}
    value={value}
    onChange={onChange}
    className="w-full px-4 py-2 bg-grey border border-tan/50 rounded-lg focus:ring-green focus:border-green text-green placeholder-white h-24 resize-none"
    placeholder={placeholder}
  />
);

export default function EvaluationDataPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [modelProvider, setModelProvider] = useState('');
  const [modelType, setModelType] = useState('Large Language Model');
  const [version, setVersion] = useState('');
  const [contextWindow, setContextWindow] = useState('4096');
  const [maxTokens, setMaxTokens] = useState('2048');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKeyRequired, setApiKeyRequired] = useState(true);
  const [authType, setAuthType] = useState('Bearer');
  const [supportsStreaming, setSupportsStreaming] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState(['text']);
  const [inputCost, setInputCost] = useState('');
  const [outputCost, setOutputCost] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customConfig, setCustomConfig] = useState('');
  
  const [metricName, setMetricName] = useState('');
  const [metricDescription, setMetricDescription] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [models, setModels] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [modelsRes, metricsRes] = await Promise.all([
          fetch('/api/models'),
          fetch('/api/metrics'),
        ]);
        
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          // 응답 형식 처리: 배열이면 그대로, 객체면 .models 속성 사용, 둘 다 아니면 빈 배열
          const modelArray = Array.isArray(modelsData) ? modelsData : (modelsData.models || []);
          setModels(modelArray);
        }
        
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          // 응답 형식 처리: 배열이면 그대로, 객체면 .metrics 속성 사용, 둘 다 아니면 빈 배열
          const metricArray = Array.isArray(metricsData) ? metricsData : (metricsData.metrics || []);
          setMetrics(metricArray);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError('데이터를 불러오는 데 실패했습니다.');
      }
    }
    fetchData();
  }, []);

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim() || user?.isGuest) return;
    
    try {
      const modelData = {
        name: modelName,
        provider: modelProvider || (isCustomModel ? 'Custom' : 'Unknown'),
        model_type: modelType,
        description: modelDescription,
        version: version || undefined,
        context_window: parseInt(contextWindow) || 4096,
        max_tokens: parseInt(maxTokens) || 2048,
        api_endpoint: isCustomModel ? apiEndpoint : undefined,
        api_key_required: apiKeyRequired,
        authentication_type: authType,
        supports_streaming: supportsStreaming,
        supported_formats: supportedFormats,
        input_cost_per_token: inputCost ? parseFloat(inputCost) : undefined,
        output_cost_per_token: outputCost ? parseFloat(outputCost) : undefined,
        is_custom_model: isCustomModel,
        custom_config: (customConfig && customConfig.trim()) ? (() => {
          try {
            return JSON.parse(customConfig);
          } catch {
            return null;
          }
        })() : undefined
      };

      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData),
      });
      
      const data = await res.json();
      if (res.ok) {
        setModels([data.model || data, ...models]);
        setMessage(`모델 "${modelName}"이(가) 추가되었습니다.`);
        setError('');
        // Reset form
        setModelName('');
        setModelDescription('');
        setModelProvider('');
        setVersion('');
        setContextWindow('4096');
        setMaxTokens('2048');
        setApiEndpoint('');
        setInputCost('');
        setOutputCost('');
        setCustomConfig('');
        setIsCustomModel(false);
        setSupportedFormats(['text']);
      } else {
        setError(data.error || '모델 추가에 실패했습니다.');
        setMessage('');
      }
    } catch (err) {
      setError('모델 추가 중 오류가 발생했습니다.');
      setMessage('');
      console.error('Error adding model:', err);
    }
  };

  const handleFormatChange = (format: string, checked: boolean) => {
    if (checked) {
      setSupportedFormats([...supportedFormats, format]);
    } else {
      setSupportedFormats(supportedFormats.filter(f => f !== format));
    }
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricName.trim() || user?.isGuest) return;
    try {
      const res = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: metricName, description: metricDescription }),
      });
      const data = await res.json();
      if (res.ok) {
        setMetrics([data.metric || data, ...metrics]);
        setMessage(`평가지표 "${metricName}"이(가) 추가되었습니다.`);
        setError('');
        setMetricName('');
        setMetricDescription('');
      } else {
        setError(data.error || '평가지표 추가에 실패했습니다.');
        setMessage('');
      }
    } catch (err) {
      setError('평가지표 추가 중 오류가 발생했습니다.');
      setMessage('');
    }
  };

  return (
    <div className="bg-lime min-h-screen">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-grey border border-tan/50 rounded-lg hover:bg-slate-grey hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            메인으로
          </button>
          <h1 className="text-xl font-bold text-green ml-4">커스텀 설정</h1>
        </div>
      </div>
      
      <main className="py-4 mx-auto max-w-5xl sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-green mb-2">모델 및 평가지표 추가</h2>
          <p className="text-white max-w-2xl mx-auto">
            새로운 AI 모델이나 사용자 정의 평가지표를 등록하여 평가 시스템을 확장할 수 있습니다.
          </p>
        </div>

        {user?.isGuest && (
          <div className="mb-6 p-4 bg-yellow-100/50 border border-yellow-300/50 rounded-lg text-sm text-yellow-800 text-center">
            ⚠️ 게스트 모드에서는 데이터가 저장되지 않습니다. 모든 기능을 이용하려면 회원가입이 필요합니다.
          </div>
        )}

        {message && <div className="mb-6 p-3 bg-green-100/50 border border-green-300/50 rounded-lg text-green-800 text-sm text-center">{message}</div>}
        {error && <div className="mb-6 p-3 bg-red-100/50 border border-red-300/50 rounded-lg text-red-800 text-sm text-center">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 !bg-white p-8 rounded-xl shadow-lg border border-tan/30">
            <h3 className="text-lg font-semibold text-green mb-4 flex items-center">
              <PlusCircleIcon className="w-6 h-6 mr-2 text-green" />
              새 모델 추가
            </h3>
            <form onSubmit={handleAddModel} className="space-y-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-green border-b border-tan/30 pb-2">기본 정보</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="modelName" className="block text-sm font-medium text-green mb-1">모델 이름 *</label>
                    <InputField id="modelName" value={modelName} onChange={e => setModelName(e.target.value)} placeholder="예: GPT-4 Turbo" required />
                  </div>
                  <div>
                    <label htmlFor="modelProvider" className="block text-sm font-medium text-green mb-1">제공자</label>
                    <InputField id="modelProvider" value={modelProvider} onChange={e => setModelProvider(e.target.value)} placeholder="예: OpenAI, Anthropic" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="version" className="block text-sm font-medium text-green mb-1">버전</label>
                    <InputField id="version" value={version} onChange={e => setVersion(e.target.value)} placeholder="예: 2024-04-09" />
                  </div>
                  <div>
                    <label htmlFor="modelType" className="block text-sm font-medium text-green mb-1">모델 타입</label>
                    <select
                      id="modelType"
                      value={modelType}
                      onChange={e => setModelType(e.target.value)}
                      className="w-full px-4 py-2 bg-grey border border-tan/50 rounded-lg focus:ring-green focus:border-green text-green"
                    >
                      <option value="Large Language Model">Large Language Model</option>
                      <option value="Vision Language Model">Vision Language Model</option>
                      <option value="Code Generation Model">Code Generation Model</option>
                      <option value="Embedding Model">Embedding Model</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="modelDesc" className="block text-sm font-medium text-green mb-1">설명</label>
                  <TextareaField id="modelDesc" value={modelDescription} onChange={e => setModelDescription(e.target.value)} placeholder="모델에 대한 간단한 설명을 입력하세요." />
                </div>
              </div>

              {/* 모델 타입 선택 */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-green border-b border-tan/30 pb-2">모델 타입</h4>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="modelCategory"
                      checked={!isCustomModel}
                      onChange={() => setIsCustomModel(false)}
                      className="mr-2"
                    />
                    <span className="text-green">기존 모델 (OpenAI, Anthropic, Google 등)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="modelCategory"
                      checked={isCustomModel}
                      onChange={() => setIsCustomModel(true)}
                      className="mr-2"
                    />
                    <span className="text-green">커스텀 모델 (사용자 정의)</span>
                  </label>
                </div>
              </div>

              {/* 모델 사양 */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-green border-b border-tan/30 pb-2">모델 사양</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contextWindow" className="block text-sm font-medium text-green mb-1">컨텍스트 윈도우</label>
                    <InputField id="contextWindow" value={contextWindow} onChange={e => setContextWindow(e.target.value)} placeholder="4096" />
                  </div>
                  <div>
                    <label htmlFor="maxTokens" className="block text-sm font-medium text-green mb-1">최대 토큰</label>
                    <InputField id="maxTokens" value={maxTokens} onChange={e => setMaxTokens(e.target.value)} placeholder="2048" />
                  </div>
                </div>
              </div>

              {/* 지원 기능 */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-green border-b border-tan/30 pb-2">지원 기능</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-green mb-2">지원 포맷</label>
                    <div className="flex flex-wrap gap-3">
                      {['text', 'image', 'audio', 'video', 'code'].map(format => (
                        <label key={format} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={supportedFormats.includes(format)}
                            onChange={e => handleFormatChange(format, e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-green capitalize">{format}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="supportsStreaming"
                      checked={supportsStreaming}
                      onChange={e => setSupportsStreaming(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="supportsStreaming" className="text-sm text-green">스트리밍 지원</label>
                  </div>
                </div>
              </div>

              {/* 커스텀 모델 전용 필드 */}
              {isCustomModel && (
                <div className="space-y-4 border-t border-tan/30 pt-4">
                  <h4 className="text-md font-medium text-green">API 설정 (커스텀 모델)</h4>
                  <div>
                    <label htmlFor="apiEndpoint" className="block text-sm font-medium text-green mb-1">API 엔드포인트 *</label>
                    <InputField id="apiEndpoint" value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} placeholder="https://api.example.com/v1/chat/completions" required={isCustomModel} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={apiKeyRequired}
                          onChange={e => setApiKeyRequired(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-green">API 키 필요</span>
                      </label>
                    </div>
                    <div>
                      <label htmlFor="authType" className="block text-sm font-medium text-green mb-1">인증 방식</label>
                      <select
                        id="authType"
                        value={authType}
                        onChange={e => setAuthType(e.target.value)}
                        className="w-full px-4 py-2 bg-grey border border-tan/50 rounded-lg focus:ring-green focus:border-green text-green"
                      >
                        <option value="Bearer">Bearer Token</option>
                        <option value="API-Key">API Key</option>
                        <option value="Basic">Basic Auth</option>
                        <option value="None">No Auth</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="customConfig" className="block text-sm font-medium text-green mb-1">커스텀 설정 (JSON)</label>
                    <textarea
                      id="customConfig"
                      value={customConfig}
                      onChange={e => setCustomConfig(e.target.value)}
                      className="w-full px-4 py-2 bg-grey border border-tan/50 rounded-lg focus:ring-green focus:border-green text-green placeholder-white h-20 resize-none font-mono text-sm"
                      placeholder='{"temperature": 0.7, "top_p": 0.9}'
                    />
                  </div>
                </div>
              )}

              {/* 비용 정보 */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-green border-b border-tan/30 pb-2">비용 정보 (선택사항)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inputCost" className="block text-sm font-medium text-green mb-1">입력 토큰당 비용 (USD)</label>
                    <InputField id="inputCost" value={inputCost} onChange={e => setInputCost(e.target.value)} placeholder="0.00001" />
                  </div>
                  <div>
                    <label htmlFor="outputCost" className="block text-sm font-medium text-green mb-1">출력 토큰당 비용 (USD)</label>
                    <InputField id="outputCost" value={outputCost} onChange={e => setOutputCost(e.target.value)} placeholder="0.00003" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={user?.isGuest} className="w-full bg-green text-white font-semibold py-3 rounded-lg hover:bg-slate-grey transition-colors disabled:bg-taupe/50 disabled:cursor-not-allowed">
                모델 추가하기
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="!bg-white p-8 rounded-xl shadow-lg border border-tan/30">
              <h3 className="text-lg font-semibold text-green mb-4 flex items-center">
                <BeakerIcon className="w-6 h-6 mr-2 text-green" />
                새 평가지표 추가
              </h3>
              <form onSubmit={handleAddMetric} className="space-y-4">
                <div>
                  <label htmlFor="metricName" className="block text-sm font-medium text-green mb-1">지표 이름</label>
                  <InputField id="metricName" value={metricName} onChange={e => setMetricName(e.target.value)} placeholder="예: 정답률 (Accuracy)" required />
                </div>
                <div>
                  <label htmlFor="metricDesc" className="block text-sm font-medium text-green mb-1">설명</label>
                  <TextareaField id="metricDesc" value={metricDescription} onChange={e => setMetricDescription(e.target.value)} placeholder="지표에 대한 설명을 입력하세요" />
                </div>
                <button type="submit" disabled={user?.isGuest} className="w-full bg-green text-white font-semibold py-2.5 rounded-lg hover:bg-slate-grey transition-colors disabled:bg-taupe/50 disabled:cursor-not-allowed">
                  평가지표 추가하기
                </button>
              </form>
            </div>

            <div className="!bg-white p-8 rounded-xl shadow-lg border border-tan/30">
              <h3 className="text-lg font-semibold text-green mb-4 flex items-center">
                <BeakerIcon className="w-6 h-6 mr-2 text-green" />
                외부 프레임워크 평가
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                검증된 외부 평가 프레임워크를 사용하여 전문적인 평가를 수행합니다.
              </p>
              <div className="space-y-3">
                <div className="text-xs text-gray-500 space-y-1">
                  <div><strong>Hugging Face Evaluate</strong>: BLEU, ROUGE, BERTScore 등</div>
                  <div><strong>OpenAI Evals</strong>: 수학, 코딩, 논리 추론</div>
                  <div><strong>LM Eval Harness</strong>: HellaSwag, MMLU, ARC</div>
                  <div><strong>BIG-bench</strong>: Google의 대규모 벤치마크</div>
                </div>
                <button 
                  onClick={() => router.push('/governance-framework/external-evaluation')}
                  className="w-full bg-green text-white font-semibold py-2.5 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                  외부 프레임워크 평가
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="!bg-white p-6 rounded-xl shadow-lg border border-tan/30">
            <h3 className="text-lg font-semibold text-green mb-4">등록된 모델 목록</h3>
            {Array.isArray(models) && models.length === 0 ? (
              <p className="text-sm text-white text-center py-4">등록된 모델이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {Array.isArray(models) && models.map((m) => (
                  <li key={m.id} className="p-3 bg-grey rounded-lg text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <strong className="text-green">{m.name}</strong>
                        <span className="text-white ml-2">({m.provider})</span>
                        {m.version && <span className="text-tan ml-1">v{m.version}</span>}
                        {m.description && <div className="text-white text-xs mt-1">{m.description}</div>}
                        <div className="text-xs text-tan mt-1">
                          컨텍스트: {m.context_window?.toLocaleString() || 'N/A'} | 
                          최대 토큰: {m.max_tokens?.toLocaleString() || 'N/A'}
                          {m.is_custom_model && <span className="ml-1 px-1 bg-orange-600 text-white rounded">CUSTOM</span>}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="!bg-white p-6 rounded-xl shadow-lg border border-tan/30">
            <h3 className="text-lg font-semibold text-green mb-4">등록된 평가지표 목록</h3>
            {Array.isArray(metrics) && metrics.length === 0 ? (
              <p className="text-sm text-white text-center py-4">등록된 지표가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {Array.isArray(metrics) && metrics.map((met) => (
                  <li key={met.id} className="p-3 bg-grey rounded-lg text-sm">
                    <strong className="text-green">{met.name}</strong>
                    {met.description && <span className="text-white ml-2">- {met.description}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 