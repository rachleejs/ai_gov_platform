'use client';

import {
  ArrowLeftIcon,
  CheckCircleIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  BeakerIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { broadcastEvaluationUpdate } from '@/lib/evaluation-sync';

interface EvaluationResult {
  id: string;
  modelName: string;
  factualityScore: number;
  accuracyScore: number;
  specificityScore: number;
  overallScore: number;
  gradeLevel: string;
  subject: string;
  evaluatedAt: string;
}

export default function EducationalQualityEvaluation() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [models, setModels] = useState<{ id: string, name: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('3');
  const [selectedSubject, setSelectedSubject] = useState<string>('math');
  const [isEvaluating, setIsEvaluating] = useState(false);

  const evaluationCriteria = [
    {
      id: 'factuality',
      name: '사실성 평가',
      description: '모델 출력의 사실 정확성 및 환각(Hallucination) 탐지',
      icon: CheckCircleIcon,
      metrics: [
        '임베딩 유사도 (Embedding Similarity)',
        '참조 중복도 (Reference Overlap)',
        '사실 검증 점수 (Fact Verification)',
        '신뢰도 분석 (Confidence Analysis)'
      ],
      color: 'text-blue-600',
      bgColor: 'bg-transparent',
      borderColor: 'border-white'
    },
    {
      id: 'accuracy',
      name: '정확성 평가',
      description: '교과 내용과의 일치성 및 오류 없는 정보 제공',
      icon: BeakerIcon,
      metrics: [
        '내용 정확도 (Content Accuracy)',
        '오류 비율 (Error-free Ratio)',
        '교과서 일치도 (Curriculum Alignment)',
        '학습 표준 준수도 (Standard Compliance)'
      ],
      color: 'text-green-600',
      bgColor: 'bg-transparent',
        borderColor: 'border-white'
    },
    {
      id: 'specificity',
      name: '구체성 평가',
      description: '교육 목표 충족도 및 학년별 적합성',
      icon: BookOpenIcon,
      metrics: [
        '세부 수준 (Detail Level)',
        '학습 목표 일치도 (Objective Alignment)',
        '학생 적합성 (Student Appropriateness)',
        '설명 품질 (Explanation Quality)'
      ],
      color: 'text-purple-600',
      bgColor: 'bg-transparent',
      borderColor: 'border-white'
    }
  ];

  const gradeOptions = [
    { value: '1', label: '1학년' },
    { value: '2', label: '2학년' },
    { value: '3', label: '3학년' },
    { value: '4', label: '4학년' },
    { value: '5', label: '5학년' },
    { value: '6', label: '6학년' }
  ];

  const subjectOptions = [
    { value: 'math', label: '수학' },
    { value: 'korean', label: '국어' },
    { value: 'science', label: '과학' },
    { value: 'social', label: '사회' },
    { value: 'english', label: '영어' }
  ];

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          setModels(data);
          if (data.length > 0) {
            setSelectedModel(data[0].id);
          }
        } else {
          console.error('Failed to fetch models');
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    // 실제 평가 결과 불러오기
    const fetchEvaluationResults = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/evaluation/educational-quality');
        if (response.ok) {
          const data = await response.json();
          const formattedResults: EvaluationResult[] = data.map((item: any) => ({
            id: item.id,
            modelName: item.ai_models?.name || 'Unknown',
            factualityScore: item.factuality_score,
            accuracyScore: item.accuracy_score,
            specificityScore: item.specificity_score,
            overallScore: item.overall_score,
            gradeLevel: `${item.grade_level}학년`,
            subject: (() => {
              const subjectMap: { [key: string]: string } = {
                'math': '수학',
                'korean': '국어',
                'science': '과학',
                'social': '사회',
                'english': '영어'
              };
              return subjectMap[item.subject] || item.subject;
            })(),
            evaluatedAt: new Date(item.created_at).toISOString().split('T')[0]
          }));
          setEvaluationResults(formattedResults);
        }
      } catch (error) {
        console.error('Error fetching evaluation results:', error);
      }
    };

    fetchEvaluationResults();
  }, [user]);

  const handleStartEvaluation = async () => {
    if (!selectedModel || !user) {
      alert('모델을 선택하고 로그인 후 평가를 시작할 수 있습니다.');
      return;
    }

    setIsEvaluating(true);
    
    try {
      // 실제 평가 API 호출
      const response = await fetch('/api/evaluation/educational-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: selectedModel,
          gradeLevel: selectedGrade,
          subject: selectedSubject
        })
      });

      if (!response.ok) {
        throw new Error('평가 API 호출 실패');
      }

      const evaluationResult = await response.json();
      
      const newResult: EvaluationResult = {
        id: Date.now().toString(),
        modelName: evaluationResult.modelName,
        factualityScore: evaluationResult.factualityScore,
        accuracyScore: evaluationResult.accuracyScore,
        specificityScore: evaluationResult.specificityScore,
        overallScore: evaluationResult.overallScore,
        gradeLevel: evaluationResult.gradeLevel,
        subject: evaluationResult.subject,
        evaluatedAt: evaluationResult.evaluatedAt
      };
      
      setEvaluationResults(prev => [newResult, ...prev]);
      
      // 평가 완료 브로드캐스트
      try {
        broadcastEvaluationUpdate(selectedModel, 'educational-quality', {
          total_score: evaluationResult.overallScore,
          gradeLevel: evaluationResult.gradeLevel,
          subject: evaluationResult.subject
        });
        console.log('📡 교육 품질 평가 완료 브로드캐스트 전송:', selectedModel);
      } catch (broadcastError) {
        console.error('브로드캐스트 오류:', broadcastError);
      }
      
      alert('평가가 완료되었습니다!');
    } catch (error) {
      console.error('Evaluation failed:', error);
      alert('평가 중 오류가 발생했습니다.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green';
    if (score >= 80) return 'text-green';
    if (score >= 70) return 'text-green';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return '우수';
    if (score >= 80) return '양호';
    if (score >= 70) return '보통';
    return '개선필요';
  };

  return (
    <div className="bg-grey min-h-screen">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <Link
            href="/governance-framework"
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-grey border border-tan/50 rounded-lg hover:bg-tan"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            거버넌스 프레임워크로
          </Link>
          <h1 className="text-2xl font-bold text-green ml-4">초등교육 품질평가 (Edu-sLLM-Quality)</h1>
        </div>
      </div>

      <main className="py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* 평가 프레임워크 소개 */}
        <div className="mb-8 bg-transparent rounded-2xl shadow-lg border border-lime p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <AcademicCapIcon className="h-16 w-16 text-green" />
            </div>
            <h2 className="text-3xl font-bold text-green mb-4">교육 도메인 특화 AI 품질 평가</h2>
            <p className="text-white max-w-4xl mx-auto text-lg leading-relaxed">
              초등 교육 도메인에 특화된 소규모 언어 모델(SLLM)의 출력 품질을 
              <strong className="text-green"> 사실성, 정확성, 구체성</strong> 기준으로 종합 평가합니다. 
              AI 교사나 AI 튜터로서 구현되는 AI 챗봇 모델의 교육적 효과성을 검증합니다.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {evaluationCriteria.map((criteria) => (
              <div key={criteria.id} className={`${criteria.bgColor} ${criteria.borderColor} border-2 rounded-xl p-6`}>
                <div className="flex items-center mb-4">
                  <criteria.icon className={`h-8 w-8 ${criteria.color} mr-3`} />
                  <h3 className="text-xl font-bold text-gray-800">{criteria.name}</h3>
                </div>
                <p className="text-gray-700 mb-4">{criteria.description}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800 text-sm">평가 지표:</h4>
                  <ul className="space-y-1">
                    {criteria.metrics.map((metric, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 평가 실행 섹션 */}
        <div className="mb-8 bg-transparent rounded-2xl shadow-lg border border-lime p-8">
          <h3 className="text-2xl font-bold text-green mb-6">새로운 평가 실행</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">모델 선택</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green focus:border-transparent text-green placeholder:text-green/50"
              >
                <option value="">모델을 선택하세요</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green focus:border-transparent text-green placeholder:text-green/50"
              >
                {gradeOptions.map((grade) => (
                  <option key={grade.value} value={grade.value}>{grade.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">과목</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green focus:border-transparent text-green placeholder:text-green/50"
              >
                {subjectOptions.map((subject) => (
                  <option key={subject.value} value={subject.value}>{subject.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleStartEvaluation}
                disabled={isEvaluating || !selectedModel || !user}
                className="w-full bg-green text-white py-3 px-6 rounded-lg hover:bg-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                {isEvaluating ? (
                  <div className="flex items-center justify-center">
                    <ClockIcon className="animate-spin h-5 w-5 mr-2" />
                    평가 중...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <PlayIcon className="h-5 w-5 mr-2" />
                    평가 시작
                  </div>
                )}
              </button>
            </div>
          </div>
          
          {!user && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
                평가를 실행하려면 로그인이 필요합니다.
              </p>
            </div>
          )}
        </div>

        {/* 평가 결과 섹션 */}
        <div className="bg-transparent rounded-2xl shadow-lg border border-lime p-8">
          <h3 className="text-2xl font-bold text-green mb-6">평가 결과 이력</h3>
          
          {evaluationResults.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">아직 평가 결과가 없습니다.</p>
              <p className="text-gray-400">위에서 새로운 평가를 시작해보세요.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">모델</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">학년/과목</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">사실성</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">정확성</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">구체성</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">종합점수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">평가일</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-gray-200">
                  {evaluationResults.map((result) => (
                    <tr key={result.id} className="hover:bg-grey">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{result.modelName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{result.gradeLevel}</div>
                        <div className="text-sm text-gray-500">{result.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getScoreColor(result.factualityScore)}`}>
                          {result.factualityScore}점
                        </div>
                        <div className="text-sm text-gray-500">{getScoreLabel(result.factualityScore)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getScoreColor(result.accuracyScore)}`}>
                          {result.accuracyScore}점
                        </div>
                        <div className="text-sm text-gray-500">{getScoreLabel(result.accuracyScore)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getScoreColor(result.specificityScore)}`}>
                          {result.specificityScore}점
                        </div>
                        <div className="text-sm text-gray-500">{getScoreLabel(result.specificityScore)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getScoreColor(result.overallScore)}`}>
                          {result.overallScore}점
                        </div>
                        <div className="text-sm text-gray-500">{getScoreLabel(result.overallScore)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green">
                        {result.evaluatedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 