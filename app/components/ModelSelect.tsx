'use client';

import { useState, useEffect } from 'react';

interface ModelInfo {
  id: string;
  name: string;
  version: string;
  context_window: number;
  max_tokens: number;
  input_cost_per_token?: number;
  output_cost_per_token?: number;
  supported_formats: string[];
  supports_streaming: boolean;
  model_type: string;
}

interface ProviderInfo {
  displayName: string;
  models: ModelInfo[];
}

interface CommercialModels {
  [key: string]: ProviderInfo;
}

interface ModelSelectProps {
  value: string;
  onChange: (modelId: string, modelInfo?: ModelInfo) => void;
  showAdvanced?: boolean;
  className?: string;
  label?: string;
}

export const ModelSelect: React.FC<ModelSelectProps> = ({ 
  value, 
  onChange, 
  showAdvanced = false,
  className = "",
  label = "모델 선택"
}) => {
  const [catalog, setCatalog] = useState<CommercialModels>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedModelInfo, setSelectedModelInfo] = useState<ModelInfo | null>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch('/api/models?source=commercial');
        if (response.ok) {
          const data = await response.json();
          setCatalog(data);
        } else {
          setError('모델 카탈로그를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setError('모델 카탈로그를 불러오는 중 오류가 발생했습니다.');
        console.error('Error fetching commercial models:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  // 선택된 모델의 상세 정보 찾기
  useEffect(() => {
    if (value && catalog) {
      let foundModel: ModelInfo | null = null;
      for (const provider of Object.values(catalog)) {
        const model = provider.models.find(m => m.id === value);
        if (model) {
          foundModel = model;
          break;
        }
      }
      setSelectedModelInfo(foundModel);
    } else {
      setSelectedModelInfo(null);
    }
  }, [value, catalog]);

  const handleModelChange = (modelId: string) => {
    let modelInfo: ModelInfo | undefined;
    for (const provider of Object.values(catalog)) {
      const model = provider.models.find(m => m.id === modelId);
      if (model) {
        modelInfo = model;
        break;
      }
    }
    onChange(modelId, modelInfo);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-green">{label}</label>
        <div className="w-full px-3 py-2 border border-white rounded-lg bg-transparent text-green animate-pulse">
          모델 목록을 불러오는 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-green">{label}</label>
        <div className="w-full px-3 py-2 border border-red-500 rounded-lg bg-transparent text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-green">{label}</label>
      <select
        value={value}
        onChange={e => handleModelChange(e.target.value)}
        className="w-full px-3 py-2 bg-transparent border border-white rounded-lg focus:ring-green focus:border-green text-green"
      >
        <option value="" className="bg-grey text-white">모델을 선택하세요</option>
        {Object.entries(catalog).map(([providerId, provider]) => (
          <optgroup key={providerId} label={provider.displayName} className="bg-grey text-white">
            {provider.models.map(model => (
              <option key={model.id} value={model.id} className="bg-grey text-white">
                {model.name} ({model.version})
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* 선택된 모델의 상세 정보 표시 */}
      {selectedModelInfo && (
        <div className="text-xs text-tan space-y-1">
          <div>컨텍스트: {selectedModelInfo.context_window?.toLocaleString()} 토큰</div>
          <div>최대 출력: {selectedModelInfo.max_tokens?.toLocaleString()} 토큰</div>
          <div>지원 형식: {selectedModelInfo.supported_formats?.join(', ')}</div>
          {selectedModelInfo.input_cost_per_token && (
            <div>
              비용: ${selectedModelInfo.input_cost_per_token?.toFixed(6)}/입력토큰, 
              ${selectedModelInfo.output_cost_per_token?.toFixed(6)}/출력토큰
            </div>
          )}
        </div>
      )}

      {/* 고급 설정 (필요한 경우) */}
      {showAdvanced && selectedModelInfo && (
        <details className="text-xs mt-2 cursor-pointer border border-tan/30 rounded p-2">
          <summary className="text-tan font-medium">고급 설정</summary>
          <div className="mt-2 space-y-2 text-white">
            <div>모델 타입: {selectedModelInfo.model_type}</div>
            <div>스트리밍 지원: {selectedModelInfo.supports_streaming ? '예' : '아니오'}</div>
            {/* 필요에 따라 추가 설정 필드들을 여기에 추가할 수 있습니다 */}
          </div>
        </details>
      )}
    </div>
  );
};
