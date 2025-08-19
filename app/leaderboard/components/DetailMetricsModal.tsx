'use client';

import { useState, useEffect } from 'react';

interface DetailMetricsModalProps {
  model: any;
  isOpen: boolean;
  onClose: () => void;
  fetchDetailedMetrics: (modelId: string) => Promise<any>;
}

export const DetailMetricsModal = ({ model, isOpen, onClose, fetchDetailedMetrics }: DetailMetricsModalProps) => {
  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && model) {
      setLoading(true);
      fetchDetailedMetrics(model.id).then(data => {
        setDetailData(data);
        setLoading(false);
      });
    }
  }, [isOpen, model, fetchDetailedMetrics]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-grey rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-lime">
        <div className="p-6 border-b border-lime/30">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">{model.name} - 상세 메트릭</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-lime transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-white text-lg">로딩 중...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Deep 메트릭 상세 */}
              {detailData?.deepMetrics && (
                <div className="bg-transparent border border-lime/20 rounded-xl p-4">
                  <h3 className="text-xl font-semibold text-lime mb-4">Deep 메트릭 세부 점수</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detailData.deepMetrics.success && detailData.deepMetrics.data?.length > 0 ? (
                      detailData.deepMetrics.data[0].model_results?.[model.id]?.metrics ? (
                        Object.entries(detailData.deepMetrics.data[0].model_results[model.id].metrics).map(([metric, result]: [string, any]) => (
                          <div key={metric} className="bg-white/5 p-3 rounded-lg">
                            <div className="text-white font-medium">{metric}</div>
                            <div className="text-lime text-lg font-bold">{(result.score * 100).toFixed(1)}%</div>
                            <div className="text-white/60 text-sm">{result.passed ? '통과' : '미통과'}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-white/60">상세 메트릭 데이터가 없습니다.</div>
                      )
                    ) : (
                      <div className="text-white/60">Deep 메트릭 데이터가 없습니다.</div>
                    )}
                  </div>
                </div>
              )}

              {/* 심리학 상세 */}
              {detailData?.psychology && (
                <div className="bg-transparent border border-lime/20 rounded-xl p-4">
                  <h3 className="text-xl font-semibold text-lime mb-4">심리학적 평가 세부 점수</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {detailData.psychology.area_scores ? (
                      Object.entries(detailData.psychology.area_scores).map(([area, score]: [string, any]) => (
                        <div key={area} className="bg-white/5 p-3 rounded-lg">
                          <div className="text-white font-medium">{area.replace(/_/g, ' ')}</div>
                          <div className="text-lime text-lg font-bold">{score}/5</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-white/60">심리학 평가 데이터가 없습니다.</div>
                    )}
                  </div>
                </div>
              )}

              {/* 교육 품질 상세 */}
              {detailData?.educational && Array.isArray(detailData.educational) && detailData.educational.length > 0 && (
                <div className="bg-transparent border border-lime/20 rounded-xl p-4">
                  <h3 className="text-xl font-semibold text-lime mb-4">교육 품질 평가 세부 점수</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-white font-medium">사실성</div>
                      <div className="text-lime text-lg font-bold">{detailData.educational[0].factuality_score || 0}점</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-white font-medium">정확성</div>
                      <div className="text-lime text-lg font-bold">{detailData.educational[0].accuracy_score || 0}점</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-white font-medium">구체성</div>
                      <div className="text-lime text-lg font-bold">{detailData.educational[0].specificity_score || 0}점</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
