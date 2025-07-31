// 외부 평가 프레임워크 통합 API

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { OpenAIEvalsManager } from '@/lib/openaiEvalsIntegration';
import { HuggingFaceEvaluator } from '@/lib/huggingfaceEvaluator';

interface ExternalFrameworkRequest {
  framework: 'openai-evals' | 'huggingface-evaluate' | 'lm-eval-harness' | 'big-bench';
  modelId: string;
  evaluationId: string;
  options?: Record<string, any>;
}

interface ExternalFrameworkResponse {
  success: boolean;
  data?: {
    framework: string;
    evaluationId: string;
    modelId: string;
    score: number;
    details: any;
    timestamp: Date;
  };
  error?: string;
  availableEvaluations?: Array<{
    id: string;
    name: string;
    description: string;
    framework: string;
    category: string;
  }>;
}

// GET: 사용 가능한 외부 평가 프레임워크 및 평가 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/evaluation/external-frameworks - 외부 프레임워크 목록 요청");
    
    const { searchParams } = new URL(request.url);
    const framework = searchParams.get('framework');
    
    let availableEvaluations: Array<{
      id: string;
      name: string;
      description: string;
      framework: string;
      category: string;
    }> = [];

    // 각 프레임워크별로 사용 가능한 평가 목록 수집
    if (!framework || framework === 'openai-evals') {
      const openaiEvals = new OpenAIEvalsManager();
      const evals = openaiEvals.getAvailableEvals();
      availableEvaluations.push(...evals.map(evaluation => ({
        id: evaluation.id,
        name: evaluation.name,
        description: evaluation.description,
        framework: 'openai-evals',
        category: evaluation.category
      })));
    }

    if (!framework || framework === 'huggingface-evaluate') {
      const hfEvaluator = new HuggingFaceEvaluator();
      const metrics = hfEvaluator.getAvailableMetrics();
      availableEvaluations.push(...metrics.map(metric => ({
        id: metric.id,
        name: metric.name,
        description: metric.description,
        framework: 'huggingface-evaluate',
        category: metric.category
      })));
    }

    // LM Evaluation Harness 지원 평가들 (하드코딩)
    if (!framework || framework === 'lm-eval-harness') {
      const lmEvalTasks = [
        {
          id: 'hellaswag',
          name: 'HellaSwag',
          description: '상식 추론 평가',
          framework: 'lm-eval-harness',
          category: 'reasoning'
        },
        {
          id: 'arc_easy',
          name: 'ARC Easy',
          description: '과학 질문 답변 (쉬움)',
          framework: 'lm-eval-harness',
          category: 'knowledge'
        },
        {
          id: 'arc_challenge',
          name: 'ARC Challenge',
          description: '과학 질문 답변 (어려움)',
          framework: 'lm-eval-harness',
          category: 'knowledge'
        },
        {
          id: 'mmlu',
          name: 'MMLU',
          description: '대규모 다영역 언어 이해',
          framework: 'lm-eval-harness',
          category: 'knowledge'
        }
      ];
      availableEvaluations.push(...lmEvalTasks);
    }

    // BIG-bench 지원 평가들 (하드코딩)
    if (!framework || framework === 'big-bench') {
      const bigBenchTasks = [
        {
          id: 'arithmetic',
          name: 'Arithmetic',
          description: '산술 계산 능력',
          framework: 'big-bench',
          category: 'math'
        },
        {
          id: 'logical_deduction',
          name: 'Logical Deduction',
          description: '논리적 추론',
          framework: 'big-bench',
          category: 'reasoning'
        },
        {
          id: 'causal_judgement',
          name: 'Causal Judgement',
          description: '인과관계 판단',
          framework: 'big-bench',
          category: 'reasoning'
        }
      ];
      availableEvaluations.push(...bigBenchTasks);
    }
    
    return NextResponse.json({
      success: true,
      availableEvaluations
    } as ExternalFrameworkResponse);
    
  } catch (error) {
    console.error('Error fetching external frameworks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch external frameworks' } as ExternalFrameworkResponse,
      { status: 500 }
    );
  }
}

// POST: 외부 프레임워크를 사용한 평가 실행
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/evaluation/external-frameworks - 외부 프레임워크 평가 실행");
    
    // 인증 확인
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();
    
    // 인증 요구 사항 완화 - 테스트 목적으로 인증 없이도 접근 허용
    // 실제 프로덕션 환경에서는 이 부분을 다시 활성화해야 합니다
    /*
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ExternalFrameworkResponse,
        { status: 401 }
      );
    }
    */
    
    const body: ExternalFrameworkRequest = await request.json();
    const { framework, modelId, evaluationId, options = {} } = body;
    
    if (!framework || !modelId || !evaluationId) {
      return NextResponse.json(
        { success: false, error: 'framework, modelId, and evaluationId are required' } as ExternalFrameworkResponse,
        { status: 400 }
      );
    }
    
    // 모델 존재 여부 확인
    const { data: model, error: modelError } = await supabase
      .from('ai_models')
      .select('name')
      .eq('id', modelId)
      .single();
    
    if (modelError || !model) {
      return NextResponse.json(
        { success: false, error: 'Model not found' } as ExternalFrameworkResponse,
        { status: 404 }
      );
    }
    
    console.log(`🔧 Running ${framework} evaluation: ${evaluationId} for model: ${model.name}`);
    
    let result: any;
    
    // 프레임워크별로 평가 실행
    switch (framework) {
      case 'openai-evals':
        const openaiManager = new OpenAIEvalsManager();
        result = await openaiManager.runEvaluation(evaluationId, model.name, options);
        break;
        
      case 'huggingface-evaluate':
        const hfEvaluator = new HuggingFaceEvaluator();
        const hfRequest = {
          modelId,
          metricIds: [evaluationId],
          testData: {
            questions: options.questions || ['Sample question'],
            references: options.references
          }
        };
        const hfResult = await hfEvaluator.evaluateModel(hfRequest);
        result = {
          evalId: evaluationId,
          evalName: evaluationId,
          modelName: model.name,
          score: hfResult.metrics[evaluationId]?.score || 0,
          details: hfResult.metrics[evaluationId]?.details || {},
          timestamp: new Date()
        };
        break;
        
      case 'lm-eval-harness':
        result = await runLMEvalHarness(evaluationId, model.name, options);
        break;
        
      case 'big-bench':
        result = await runBigBench(evaluationId, model.name, options);
        break;
        
      default:
        throw new Error(`Unsupported framework: ${framework}`);
    }
    
    // 결과를 데이터베이스에 저장 (세션이 있는 경우만)
    if (session) {
      try {
        const { data: savedResult, error: saveError } = await supabase
          .from('external_framework_evaluations')
          .insert([
            {
              model_id: modelId,
              user_id: session.user.id,
              framework: framework,
              evaluation_id: evaluationId,
              score: result.score || 0,
              details: result.details || {},
              timestamp: result.timestamp.toISOString()
            }
          ])
          .select()
          .single();
          
        if (saveError) {
          console.error('Error saving external framework evaluation result:', saveError);
          // 저장 실패해도 평가 결과는 반환
        } else {
          console.log('✅ External framework evaluation result saved to database');
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // 데이터베이스 오류가 있어도 평가 결과는 반환
      }
    } else {
      console.log('⚠️ No session found, skipping database save (test mode)');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        framework,
        evaluationId,
        modelId,
        score: result.score || 0,
        details: result.details || {},
        timestamp: result.timestamp
      }
    } as ExternalFrameworkResponse);
    
  } catch (error) {
    console.error('Error executing external framework evaluation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'External framework evaluation failed' 
      } as ExternalFrameworkResponse,
      { status: 500 }
    );
  }
}

// LM Evaluation Harness 실행 (시뮬레이션)
async function runLMEvalHarness(taskName: string, modelName: string, options: any) {
  console.log(`🔄 Simulating LM Eval Harness: ${taskName} for ${modelName}`);
  
  // 시뮬레이션 지연 시간
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  // 태스크별 시뮬레이션 점수
  const simulatedScores: Record<string, number> = {
    'hellaswag': 65 + Math.random() * 20,
    'arc_easy': 70 + Math.random() * 25, 
    'arc_challenge': 45 + Math.random() * 30,
    'mmlu': 55 + Math.random() * 35
  };
  
  const score = Math.round(simulatedScores[taskName] || (50 + Math.random() * 40));
  
  return {
    evalId: taskName,
    evalName: taskName,
    modelName,
    score,
    details: { 
      simulation: true,
      message: `Simulated ${taskName} evaluation for ${modelName}`,
      framework: 'lm-eval-harness' 
    },
    timestamp: new Date()
  };
}

// BIG-bench 실행 (시뮬레이션)
async function runBigBench(taskName: string, modelName: string, options: any) {
  console.log(`🔄 Simulating BIG-bench: ${taskName} for ${modelName}`);
  
  // 시뮬레이션 지연 시간
  await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
  
  // 태스크별 시뮬레이션 점수
  const simulatedScores: Record<string, number> = {
    'arithmetic': 75 + Math.random() * 20,
    'logical_deduction': 60 + Math.random() * 30,
    'causal_judgement': 55 + Math.random() * 25
  };
  
  const score = Math.round(simulatedScores[taskName] || (45 + Math.random() * 50));
  
  return {
    evalId: taskName,
    evalName: taskName,
    modelName,
    score,
    details: { 
      simulation: true,
      message: `Simulated ${taskName} evaluation for ${modelName}`,
      framework: 'big-bench' 
    },
    timestamp: new Date()
  };
} 