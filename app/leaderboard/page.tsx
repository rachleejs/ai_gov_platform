'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Leaderboard() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllModelScores = async () => {
      try {
        const modelsResponse = await fetch('/api/models');
        if (!modelsResponse.ok) {
          console.error('Failed to fetch models:', modelsResponse.status);
          setLoading(false);
          return;
        }
        
        const modelsData = await modelsResponse.json();
        const modelArray = Array.isArray(modelsData) ? modelsData : (modelsData.models || []);

        const modelsWithScores = await Promise.all(
          modelArray.map(async (model: any) => {
            let ethicsScore = 0;
            let psychologyScore = 0;
            let deepMetricsScore = 0; // Placeholder
            let educationalQualityScore = 0;

            // Fetch ethics score
            try {
              const ethicsRes = await fetch(`/api/evaluation/ethics?modelId=${model.id}`);
              if (ethicsRes.ok) {
                const ethicsData = await ethicsRes.json();
                if (ethicsData && ethicsData.length > 0) {
                  const total = ethicsData.reduce((sum: number, item: any) => sum + (item.score || 0), 0);
                  ethicsScore = Math.round(total / ethicsData.length);
                }
              }
            } catch (e) { console.error(`Failed to fetch ethics score for ${model.name}`, e); }

            // Fetch psychology score
            try {
              const psychologyRes = await fetch(`/api/evaluation/psychological?modelId=${model.id}`);
              if (psychologyRes.ok) {
                const psychologyData = await psychologyRes.json();
                psychologyScore = psychologyData?.percentage || 0;
              }
            } catch (e) { console.error(`Failed to fetch psychology score for ${model.name}`, e); }
            
            // Fetch educational quality score
            try {
              const educationalRes = await fetch(`/api/evaluation/educational-quality?modelId=${model.id}`);
              if (educationalRes.ok) {
                const educationalData = await educationalRes.json();
                if (educationalData && educationalData.length > 0) {
                  educationalQualityScore = educationalData[0].total_score || 0;
                }
              }
            } catch (e) { console.error(`Failed to fetch educational quality score for ${model.name}`, e); }
            
            return {
              ...model,
              ethicsScore,
              psychologyScore,
              deepMetricsScore,
              educationalQualityScore,
            };
          })
        );
        
        setModels(modelsWithScores);

      } catch (error) {
        console.error('Error fetching model scores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllModelScores();
  }, []);

  const calculateTotalScore = (model: any) => {
    return (model.ethicsScore || 0) + (model.psychologyScore || 0) + (model.deepMetricsScore || 0) + (model.educationalQualityScore || 0);
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
            <div className="bg-transparent p-6 rounded-xl shadow-md border-4 border-white">
              <h2 className="font-semibold text-white mb-6" style={{ fontSize: '18pt' }}>종합 성능 리더보드</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-transparent text-left font-medium uppercase tracking-wider" style={{ fontSize: '11pt' }}>순위</th>
                      <th className="px-6 py-3 bg-transparent text-left font-medium uppercase tracking-wider" style={{ fontSize: '11pt' }}>모델명</th>
                      <th className="px-6 py-3 bg-transparent text-left font-medium uppercase tracking-wider" style={{ fontSize: '11pt' }}>제공업체</th>
                      <th className="px-6 py-3 bg-transparent text-left font-medium uppercase tracking-wider" style={{ fontSize: '11pt' }}>윤리 점수</th>
                      <th className="px-6 py-3 bg-transparent text-left font-medium uppercase tracking-wider" style={{ fontSize: '11pt' }}>심리학 점수</th>
                      <th className="px-6 py-3 bg-transparent text-left font-medium uppercase tracking-wider" style={{ fontSize: '11pt' }}>Deep 메트릭 점수</th>
                      <th className="px-6 py-3 bg-transparent text-left font-medium uppercase tracking-wider" style={{ fontSize: '11pt' }}>교육 품질 점수</th>
                      <th className="px-6 py-3 bg-transparent text-left font-medium uppercase tracking-wider" style={{ fontSize: '11pt' }}>종합 점수</th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-white">
                    {sortedModels.length > 0 ? (
                      sortedModels.map((model, index) => (
                        <tr key={model.id}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium" style={{ fontSize: '12pt' }}>{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{model.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{model.provider || 'Unknown'}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{model.ethicsScore || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{model.psychologyScore || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{model.deepMetricsScore || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12pt' }}>{model.educationalQualityScore || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-lime" style={{ fontSize: '12pt' }}>
                            {calculateTotalScore(model)}
                          </td>
                        </tr>
                      )) 
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center" style={{ fontSize: '12pt' }}>
                          평가된 모델이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              <LeaderboardCategory title="윤리 점수 리더보드" models={models} scoreKey="ethicsScore" />
              <LeaderboardCategory title="심리학 점수 리더보드" models={models} scoreKey="psychologyScore" />
              <LeaderboardCategory title="Deep 메트릭 점수 리더보드" models={models} scoreKey="deepMetricsScore" />
              <LeaderboardCategory title="교육 품질 점수 리더보드" models={models} scoreKey="educationalQualityScore" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const LeaderboardCategory = ({ title, models, scoreKey }: { title: string, models: any[], scoreKey: string }) => {
  const sorted = [...models].sort((a, b) => (b[scoreKey] || 0) - (a[scoreKey] || 0)).slice(0, 5);

  return (
    <div className="bg-transparent p-6 rounded-xl shadow-md border-4 border-white">
      <h3 className="font-semibold text-white mb-4" style={{ fontSize: '16pt' }}>{title}</h3>
      <ul className="space-y-3">
        {sorted.length > 0 ? (
          sorted.map((model, index) => (
            <li key={model.id} className="flex justify-between items-center p-2 hover:bg-white/10 rounded">
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-transparent border border-lime text-white flex items-center justify-center mr-3" style={{ fontSize: '10pt' }}>{index + 1}</span> 
                <span style={{ fontSize: '12pt' }}>{model.name}</span>
              </div>
              <span className="font-medium" style={{ fontSize: '12pt' }}>{model[scoreKey] || 0}</span>
            </li>
          ))
        ) : (
          <li className="text-center py-4" style={{ fontSize: '12pt' }}>데이터가 없습니다</li>
        )}
      </ul>
    </div>
  );
};