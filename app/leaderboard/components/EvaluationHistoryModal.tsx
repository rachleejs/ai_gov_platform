'use client';

interface EvaluationHistoryModalProps {
  model: any;
  history: any[];
  isOpen: boolean;
  onClose: () => void;
}

export const EvaluationHistoryModal = ({ model, history, isOpen, onClose }: EvaluationHistoryModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-grey rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-lime">
        <div className="p-6 border-b border-lime/30">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">{model.name} - 평가 히스토리</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-lime transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {history.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              평가 히스토리가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((evaluation, index) => (
                <div key={index} className="bg-white/5 border border-lime/20 rounded-xl p-4 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 bg-lime/20 text-lime rounded-full text-sm font-medium">
                          {evaluation.type}
                        </span>
                        <span className="text-white/60 text-sm">
                          {evaluation.framework}
                        </span>
                      </div>
                      <div className="text-white font-medium mb-1">
                        {evaluation.category}
                      </div>
                      <div className="text-white/60 text-sm">
                        {new Date(evaluation.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-lime">
                        {Math.round(evaluation.score)}
                      </div>
                      <div className="text-white/60 text-sm">점</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
