import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 임시로 평가 프레임워크 로직을 구현 (실제로는 Python API 호출)
interface EvaluationRequest {
  modelId: string;
  gradeLevel: string;
  subject: string;
}

interface EvaluationResult {
  factualityScore: number;
  accuracyScore: number;
  specificityScore: number;
  overallScore: number;
  modelName: string;
  gradeLevel: string;
  subject: string;
  evaluatedAt: string;
  details: {
    factuality: {
      embedding_similarity: number;
      reference_overlap: number;
      fact_verification: number;
      confidence_analysis: number;
    };
    accuracy: {
      content_accuracy: number;
      error_free_ratio: number;
      curriculum_alignment: number;
      standard_compliance: number;
    };
    specificity: {
      detail_level: number;
      objective_alignment: number;
      student_appropriateness: number;
      explanation_quality: number;
    };
  };
}

import { callModel } from '@/lib/modelApi';

// 실제 모델 API 호출
async function callModelAPI(modelId: string, question: string): Promise<string> {
  try {
    const prompt = `다음 질문에 초등학생이 이해할 수 있도록 명확하고 정확하게 답변해 주세요:\n\n질문: ${question}\n\n답변:`;
    
    // 실제 모델 API 호출 (폴백 시뮬레이션 포함)
    const response = await callModel(modelId, prompt);
    
    return response;
  } catch (error) {
    console.error('Model API call failed:', error);
    
    // 에러 발생시 기본 응답 반환
    return "죄송합니다. 현재 답변을 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  }
}

// 테스트 질문 데이터
const getTestQuestions = (gradeLevel: string, subject: string) => {
  const questions: { [key: string]: { [key: string]: Array<{question: string, reference: string}> } } = {
    '3': {
      'math': [
        {
          question: "17 + 25 = ?",
          reference: "17 + 25 = 42. 일의 자리 7 + 5 = 12이므로 1은 십의 자리로 올려 계산합니다. 십의 자리는 1 + 1 + 2 = 4이므로 답은 42입니다."
        },
        {
          question: "삼각형의 세 각의 합은 몇 도인가요?",
          reference: "삼각형의 세 각의 합은 180도입니다. 어떤 삼각형이든 세 각의 합은 항상 180도입니다."
        },
        {
          question: "직사각형의 가로 길이가 7cm, 세로 길이가 4cm일 때 둘레의 길이는 얼마인가요?",
          reference: "직사각형의 둘레는 22cm입니다. 직사각형의 둘레는 (가로 + 세로) × 2로 계산하므로, (7cm + 4cm) × 2 = 11cm × 2 = 22cm입니다."
        }
      ],
      'korean': [
        {
          question: "다음 문장에서 주어를 찾으세요: '귀여운 강아지가 공원에서 뛰어놀고 있다.'",
          reference: "주어는 '귀여운 강아지'입니다. 주어는 문장에서 동작을 하는 대상을 나타냅니다."
        },
        {
          question: "'크다'의 반대말은 무엇인가요?",
          reference: "'크다'의 반대말은 '작다'입니다."
        }
      ],
      'science': [
        {
          question: "물의 상태 변화에는 어떤 것들이 있나요?",
          reference: "물의 상태 변화에는 고체(얼음), 액체(물), 기체(수증기) 사이의 변화가 있습니다."
        }
      ]
    },
    '4': {
      'math': [
        {
          question: "분수 1/2 + 1/4의 값은?",
          reference: "1/2 + 1/4 = 2/4 + 1/4 = 3/4입니다. 분모가 다른 분수를 더할 때는 통분을 해야 합니다."
        },
        {
          question: "평행사변형의 성질을 설명하세요.",
          reference: "평행사변형은 대변이 평행하고 길이가 같으며, 대각이 같다는 성질이 있습니다."
        }
      ],
      'korean': [
        {
          question: "관형어의 역할은 무엇인가요?",
          reference: "관형어는 체언(명사)을 꾸며주는 말로, 명사의 뜻을 더 자세히 나타내는 역할을 합니다."
        }
      ]
    }
  };

  return questions[gradeLevel]?.[subject] || questions['3']['math'];
};

import { evaluateModelResponse } from '@/lib/evaluationMetrics';

export async function POST(request: NextRequest) {
  try {
    const { modelId, gradeLevel, subject }: EvaluationRequest = await request.json();

    if (!modelId || !gradeLevel || !subject) {
      return NextResponse.json(
        { error: 'modelId, gradeLevel, subject are required' },
        { status: 400 }
      );
    }

    // Supabase에서 모델 정보 조회
    const supabase = createClient();
    const { data: model, error: modelError } = await supabase
      .from('ai_models')
      .select('name')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    // 테스트 질문 가져오기
    const testQuestions = getTestQuestions(gradeLevel, subject);
    
    // 각 질문에 대해 모델 호출 및 평가 (순차 처리로 API 속도 제한 방지)
    const results = [];
    
    for (let i = 0; i < testQuestions.length; i++) {
      const item = testQuestions[i];
      
      try {
        console.log(`📝 Processing question ${i + 1}/${testQuestions.length}: ${item.question.substring(0, 50)}...`);
        
        // 1. 모델 API 호출 (API 속도 제한 방지를 위해 딜레이 추가)
        if (i > 0) {
          console.log(`⏳ Waiting 2 seconds to avoid rate limiting...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const modelResponse = await callModelAPI(modelId, item.question);
        
        // 2. 실제 평가 지표 계산
        const evaluation = evaluateModelResponse(modelResponse, item.reference, subject, gradeLevel);
        
        const factualityScore = evaluation.factuality.factuality_score;
        const accuracyScore = evaluation.accuracy.accuracy_score;
        const specificityScore = evaluation.specificity.specificity_score;
        
        results.push({
          question: item.question,
          modelResponse,
          reference: item.reference,
          factualityScore,
          accuracyScore,
          specificityScore,
          detailedMetrics: evaluation
        });
        
        console.log(`✅ Question ${i + 1} completed with scores: F:${factualityScore}, A:${accuracyScore}, S:${specificityScore}`);
        
      } catch (error) {
        console.error(`❌ Error processing question ${i + 1}:`, error);
        // 에러 발생시 기본값으로 처리
        results.push({
          question: item.question,
          modelResponse: "평가 중 오류가 발생했습니다.",
          reference: item.reference,
          factualityScore: 50,
          accuracyScore: 50,
          specificityScore: 50,
          detailedMetrics: {
            factuality: { factuality_score: 50, embedding_similarity: 50, reference_overlap: 50, fact_verification: 50, confidence_analysis: 50 },
            accuracy: { accuracy_score: 50, content_accuracy: 50, error_free_ratio: 50, curriculum_alignment: 50, standard_compliance: 50 },
            specificity: { specificity_score: 50, detail_level: 50, objective_alignment: 50, student_appropriateness: 50, explanation_quality: 50 }
          }
        });
      }
    }
    
    // 전체 평균 점수 계산
    const avgFactuality = Math.round(results.reduce((sum, r) => sum + r.factualityScore, 0) / results.length);
    const avgAccuracy = Math.round(results.reduce((sum, r) => sum + r.accuracyScore, 0) / results.length);
    const avgSpecificity = Math.round(results.reduce((sum, r) => sum + r.specificityScore, 0) / results.length);
    const overallScore = Math.round((avgFactuality + avgAccuracy + avgSpecificity) / 3);

    const evaluationResult: EvaluationResult = {
      factualityScore: avgFactuality,
      accuracyScore: avgAccuracy,
      specificityScore: avgSpecificity,
      overallScore,
      modelName: model.name,
      gradeLevel: `${gradeLevel}학년`,
      subject: {
        'math': '수학',
        'korean': '국어',
        'science': '과학',
        'social': '사회',
        'english': '영어'
      }[subject] || subject,
      evaluatedAt: new Date().toISOString().split('T')[0],
      details: {
        factuality: results[0]?.detailedMetrics?.factuality || {
          embedding_similarity: 0,
          reference_overlap: 0,
          fact_verification: 0,
          confidence_analysis: 0
        },
        accuracy: results[0]?.detailedMetrics?.accuracy || {
          content_accuracy: 0,
          error_free_ratio: 0,
          curriculum_alignment: 0,
          standard_compliance: 0
        },
        specificity: results[0]?.detailedMetrics?.specificity || {
          detail_level: 0,
          objective_alignment: 0,
          student_appropriateness: 0,
          explanation_quality: 0
        }
      }
    };

    // 평가 결과를 데이터베이스에 저장
    console.log(`💾 Saving evaluation result to database...`);
    const { data: insertData, error: insertError } = await supabase
      .from('educational_quality_evaluations')
      .insert({
        model_id: modelId,
        grade_level: gradeLevel,
        subject: subject,
        factuality_score: avgFactuality,
        accuracy_score: avgAccuracy,
        specificity_score: avgSpecificity,
        overall_score: overallScore,
        evaluation_details: evaluationResult.details,
        evaluation_results: results
      })
      .select();

    if (insertError) {
      console.error('❌ Error saving evaluation result:', insertError);
      console.error('Insert data attempted:', {
        model_id: modelId,
        grade_level: gradeLevel,
        subject: subject,
        factuality_score: avgFactuality,
        accuracy_score: avgAccuracy,
        specificity_score: avgSpecificity,
        overall_score: overallScore
      });
      // 저장 실패해도 결과는 반환
    } else {
      console.log('✅ Successfully saved evaluation result:', insertData);
    }

    return NextResponse.json(evaluationResult);

  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const gradeLevel = searchParams.get('gradeLevel');
    const subject = searchParams.get('subject');

    const supabase = createClient();
    let query = supabase
      .from('educational_quality_evaluations')
      .select(`
        *,
        ai_models(name)
      `)
      .order('created_at', { ascending: false });

    if (modelId) query = query.eq('model_id', modelId);
    if (gradeLevel) query = query.eq('grade_level', gradeLevel);
    if (subject) query = query.eq('subject', subject);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching evaluation results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 