'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Leaderboard() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 모델 목록 및 점수 가져오기
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          const modelArray = Array.isArray(data) ? data : (data.models || []);
          setModels(modelArray);
        } else {
          console.error('Failed to fetch models:', response.status);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  return ( 
    <div className="bg-orange min-h-screen">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <Link
            href="/main-dashboard"
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-grey/50 border border-grey/50 rounded-lg hover:bg-grey"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
             대시보드로
          </Link>
          <h1 className="text-xl font-bold text-green ml-4">AI 모델 리더보드</h1>
        </div>
      </div>
      
      <main className="py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-700">데이터를 불러오는 중...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-transparent p-6 rounded-xl shadow-md border border-grey">
              <h2 className="text-xl font-semibold text-green mb-6">종합 성능 리더보드</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-transparent text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순위</th>
                      <th className="px-6 py-3 bg-transparent text-left text-xs font-medium text-gray-500 uppercase tracking-wider">모델명</th>
                      <th className="px-6 py-3 bg-transparent text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제공업체</th>
                      <th className="px-6 py-3 bg-transparent text-left text-xs font-medium text-gray-500 uppercase tracking-wider">윤리 점수</th>
                      <th className="px-6 py-3 bg-transparent text-left text-xs font-medium text-gray-500 uppercase tracking-wider">심리학 점수</th>
                      <th className="px-6 py-3 bg-transparent text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시나리오 점수</th>
                      <th className="px-6 py-3 bg-transparent text-left text-xs font-medium text-gray-500 uppercase tracking-wider">종합 점수</th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-gray-200">
                    {models.length > 0 ? (
                      models.map((model, index) => (
                        <tr key={model.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.provider || 'Unknown'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.ethicsScore || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.psychologyScore || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.scenarioScore || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green">
                            {model.totalScore || ((model.ethicsScore || 0) + (model.psychologyScore || 0) + (model.scenarioScore || 0))}
                          </td>
                        </tr>
                      )) 
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          평가된 모델이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-transparent p-6 rounded-xl shadow-md border border-grey">
                <h3 className="text-lg font-semibold text-green mb-4">윤리 점수 리더보드</h3>
                <ul className="space-y-3">
                  {models.length > 0 ? (
                    [...models]
                      .sort((a, b) => (b.ethicsScore || 0) - (a.ethicsScore || 0))
                      .slice(0, 5)
                      .map((model, index) => (
                        <li key={model.id} className="flex justify-between items-center p-2 hover:bg-grey/10 rounded">
                          <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center mr-3 text-xs">{index + 1}</span>
                            <span>{model.name}</span>
                          </div>
                          <span className="font-medium text-green">{model.ethicsScore || 0}</span>
                        </li>
                      ))
                  ) : (
                    <li className="text-center text-gray-500 py-4">데이터가 없습니다</li>
                  )}
                </ul>
              </div>

              <div className="bg-transparent p-6 rounded-xl shadow-md border border-grey">
                <h3 className="text-lg font-semibold text-green mb-4">심리학 점수 리더보드</h3>
                <ul className="space-y-3">
                  {models.length > 0 ? (
                    [...models]
                      .sort((a, b) => (b.psychologyScore || 0) - (a.psychologyScore || 0))
                      .slice(0, 5)
                      .map((model, index) => (
                        <li key={model.id} className="flex justify-between items-center p-2 hover:bg-grey/10 rounded">
                          <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center mr-3 text-xs">{index + 1}</span>
                            <span>{model.name}</span>
                          </div>
                          <span className="font-medium text-green">{model.psychologyScore || 0}</span>
                        </li>
                      ))
                  ) : (
                    <li className="text-center text-gray-500 py-4">데이터가 없습니다</li>
                  )}
                </ul>
              </div>

              <div className="bg-transparent p-6 rounded-xl shadow-md border border-grey">
                <h3 className="text-lg font-semibold text-green mb-4">시나리오 점수 리더보드</h3>
                <ul className="space-y-3">
                  {models.length > 0 ? (
                    [...models]
                      .sort((a, b) => (b.scenarioScore || 0) - (a.scenarioScore || 0))
                      .slice(0, 5)
                      .map((model, index) => (
                        <li key={model.id} className="flex justify-between items-center p-2 hover:bg-grey/10 rounded">
                          <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center mr-3 text-xs">{index + 1}</span>
                            <span>{model.name}</span>
                          </div>
                          <span className="font-medium text-green">{model.scenarioScore || 0}</span>
                        </li>
                      ))
                  ) : (
                    <li className="text-center text-gray-500 py-4">데이터가 없습니다</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 