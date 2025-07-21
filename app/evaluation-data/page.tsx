'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlusCircleIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface InputFieldProps {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
}

interface TextareaFieldProps {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
}

export default function EvaluationDataPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
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
        if (modelsRes.ok) setModels((await modelsRes.json()).models);
        if (metricsRes.ok) setMetrics((await metricsRes.json()).metrics);
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
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, description: modelDescription }),
      });
      const data = await res.json();
      if (res.ok) {
        setModels([data.model, ...models]);
        setMessage(`모델 "${modelName}"이(가) 추가되었습니다.`);
        setError('');
        setModelName('');
        setModelDescription('');
      } else {
        setError(data.error || '모델 추가에 실패했습니다.');
        setMessage('');
      }
    } catch (err) {
      setError('모델 추가 중 오류가 발생했습니다.');
      setMessage('');
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
        setMetrics([data.metric, ...metrics]);
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

  const InputField = ({ id, value, onChange, placeholder, required = false }: InputFieldProps) => (
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

  const TextareaField = ({ id, value, onChange, placeholder }: TextareaFieldProps) => (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 bg-grey border border-tan/50 rounded-lg focus:ring-green focus:border-green text-green placeholder-white h-24 resize-none"
      placeholder={placeholder}
    />
  );

  return (
    <div className="bg-grey min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-tan/50 sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-grey border border-tan/50 rounded-lg hover:bg-slate-grey hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              메인으로
            </button>
            <h1 className="text-xl font-bold text-green">커스텀 설정</h1>
          </div>
        </div>
      </header>
      
      <main className="py-8 mx-auto max-w-5xl sm:px-6 lg:px-8">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-tan/30">
            <h3 className="text-lg font-semibold text-green mb-4 flex items-center">
              <PlusCircleIcon className="w-6 h-6 mr-2 text-green" />
              새 모델 추가
            </h3>
            <form onSubmit={handleAddModel} className="space-y-4">
              <div>
                <label htmlFor="modelName" className="block text-sm font-medium text-green mb-1">모델 이름</label>
                <InputField id="modelName" value={modelName} onChange={e => setModelName(e.target.value)} placeholder="예: GPT-4 Turbo" required />
              </div>
              <div>
                <label htmlFor="modelDesc" className="block text-sm font-medium text-green mb-1">설명</label>
                <TextareaField id="modelDesc" value={modelDescription} onChange={e => setModelDescription(e.target.value)} placeholder="모델에 대한 간단한 설명을 입력하세요." />
              </div>
              <button type="submit" disabled={user?.isGuest} className="w-full bg-green text-white font-semibold py-2.5 rounded-lg hover:bg-slate-grey transition-colors disabled:bg-taupe/50 disabled:cursor-not-allowed">
                모델 추가하기
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-tan/30">
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
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-tan/30">
            <h3 className="text-lg font-semibold text-green mb-4">등록된 모델 목록</h3>
            {models.length === 0 ? (
              <p className="text-sm text-white text-center py-4">등록된 모델이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {models.map((m) => (
                  <li key={m.id} className="p-3 bg-grey rounded-lg text-sm">
                    <strong className="text-green">{m.name}</strong>
                    {m.description && <span className="text-white ml-2">- {m.description}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-tan/30">
            <h3 className="text-lg font-semibold text-green mb-4">등록된 평가지표 목록</h3>
            {metrics.length === 0 ? (
              <p className="text-sm text-white text-center py-4">등록된 지표가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {metrics.map((met) => (
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