import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PsychologicalEvaluator } from '@/lib/psychologicalEvaluator';

// 모의 심리학적 평가 데이터 (데이터베이스 연결 실패 시 사용)
const mockPsychologicalData = {
  'gpt4-turbo': {
    id: '1',
    scores: {
      'cognitive_development': 4.5,
      'social_learning': 4.2,
      'identity_formation': 3.8,
      'information_processing': 4.7,
      'cognitive_load': 4.3,
      'social_identity': 4.0
    },
    total_score: 25.5,
    percentage: 85,
    grade: 'A'
  },
  'claude3-opus': {
    id: '2',
    scores: {
      'cognitive_development': 4.3,
      'social_learning': 4.5,
      'identity_formation': 4.0,
      'information_processing': 4.2,
      'cognitive_load': 4.1,
      'social_identity': 4.4
    },
    total_score: 25.5,
    percentage: 85,
    grade: 'A'
  },
  'gemini2-flash': {
    id: '3',
    scores: {
      'cognitive_development': 4.0,
      'social_learning': 4.1,
      'identity_formation': 3.9,
      'information_processing': 4.5,
      'cognitive_load': 4.2,
      'social_identity': 3.8
    },
    total_score: 24.5,
    percentage: 82,
    grade: 'A'
  }
};

export async function GET(request: Request) {
  try {
    console.log("GET /api/evaluation/psychological 요청 받음");
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    console.log("요청 파라미터 modelId:", modelId);

    // 모델 ID가 없으면 모든 평가 결과 반환
    try {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);
      const { data: { session } } = await supabase.auth.getSession();

      if (modelId) {
        // 특정 모델의 최신 평가 결과 반환
        const { data, error } = await supabase
          .from('psychological_evaluations')
          .select('*')
          .eq('model_id', modelId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching psychological evaluation:', error);
          return NextResponse.json(null);
        }

        if (data && data.length > 0) {
          // 데이터베이스 데이터를 예상 형식으로 변환
          const result = {
            model: data[0].model_name || 'Unknown Model',
            overall_score: data[0].total_score || 0,
            total_score: data[0].total_score || 0, // 호환성
            percentage: data[0].percentage || 0,
            grade: data[0].grade || 'F',
            // 새로운 필드들 추가
            area_scores: data[0].scores || {
              step_by_step_teaching: 0,
              collaborative_learning: 0,
              confidence_building: 0,
              individual_recognition: 0,
              clear_communication: 0
            },
            user_friendly_summary: data[0].user_friendly_summary || '평가 완료',
            evaluation_data: data[0].evaluation_data || null,
            // 기존 호환성 유지
            theory_scores: data[0].scores || {
              piaget: 0,
              vygotsky: 0,
              bandura: 0,
              social_identity: 0,
              information_processing: 0
            },
            details: data[0].details || '',
            timestamp: data[0].created_at
          };
          return NextResponse.json(result);
        }
        
        return NextResponse.json(null);
      } else {
        // 모든 평가 결과 반환
        const { data, error } = await supabase
          .from('psychological_evaluations')
          .select(`
            *,
            models:model_id(name)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching all psychological evaluations:', error);
          return NextResponse.json({ results: [] });
        }

        const results = (data || []).map((item: any) => ({
          model: item.models?.name || item.model_name || 'Unknown Model',
          overall_score: item.total_score || 0,
          total_score: item.total_score || 0, // 호환성
          percentage: item.percentage || 0,
          grade: item.grade || 'F',
          // 새로운 필드들 추가
          area_scores: item.scores || {
            step_by_step_teaching: 0,
            collaborative_learning: 0,
            confidence_building: 0,
            individual_recognition: 0,
            clear_communication: 0
          },
          user_friendly_summary: item.user_friendly_summary || '평가 완료',
          evaluation_data: item.evaluation_data || null,
          // 기존 호환성 유지
          theory_scores: item.scores || {
            piaget: 0,
            vygotsky: 0,
            bandura: 0,
            social_identity: 0,
            information_processing: 0
          },
          details: item.details || '',
          timestamp: item.created_at
        }));

        return NextResponse.json({ results });
      }
    } catch (dbError) {
      console.error("데이터베이스 오류:", dbError);
      return NextResponse.json(modelId ? null : { results: [] });
    }
  } catch (e) {
    console.error("GET /api/evaluation/psychological 처리 중 예외 발생:", e);
    return NextResponse.json(modelId ? null : { results: [] });
  }
}

// 심리학적 평가 엔진 인스턴스
const evaluator = new PsychologicalEvaluator();

export async function POST(request: Request) {
  try {
    console.log("POST /api/evaluation/psychological 요청 받음");
    
    const body = await request.json();
    const { modelId, modelName, provider } = body;
    console.log("요청 본문:", { modelId, modelName, provider });

    if (!modelId || !modelName || !provider) {
      return NextResponse.json({ error: 'Missing required fields: modelId, modelName, provider' }, { status: 400 });
    }

    try {
      // API 키 상태 확인
      const apiKeyStatus = {
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        google: !!process.env.GOOGLE_API_KEY
      };
      
      const providerKey = provider.toLowerCase();
      if (!apiKeyStatus[providerKey as keyof typeof apiKeyStatus]) {
        console.warn(`⚠️ ${provider} API 키가 설정되지 않았습니다. 시뮬레이션 모드로 실행됩니다.`);
      }

      // 심리학적 평가 실행
      console.log(`심리학적 평가 시작: ${modelName} (${provider})`);
      const results = await evaluator.evaluate(modelName, provider);
      console.log("심리학적 평가 완료");



      // 데이터베이스에 저장 시도
      try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { session } } = await supabase.auth.getSession();

        console.log('🗄️ DB 저장 시도 중...', {
          modelId,
          modelName,
          hasSession: !!session,
          userId: session?.user?.id,
          resultKeys: Object.keys(results)
        });

        const insertData = {
          model_id: modelId,
          user_id: session ? session.user.id : null,
          model_name: modelName,
          scores: results.area_scores,
          total_score: results.overall_score,
          percentage: results.percentage,
          grade: results.grade,
          details: results.details || '',
          user_friendly_summary: results.user_friendly_summary || '',
          evaluation_data: results.evaluation_data || null
        };

        console.log('🗄️ 삽입할 데이터:', JSON.stringify(insertData, null, 2));

        const { data, error } = await supabase
          .from('psychological_evaluations')
          .insert([insertData])
          .select();

        if (error) {
          console.error('❌ DB 저장 오류:', JSON.stringify(error, null, 2));
          console.error('❌ 오류 세부사항:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        } else {
          console.log('✅ DB 저장 성공:', data);
        }
      } catch (dbError) {
        console.error('❌ DB 연결 오류:', dbError);
        if (dbError instanceof Error) {
          console.error('❌ 오류 스택:', dbError.stack);
        }
      }

      return NextResponse.json(results);

    } catch (evaluationError) {
      console.error('심리학적 평가 실행 오류:', evaluationError);
      return NextResponse.json({ 
        error: 'Evaluation failed',
        details: evaluationError instanceof Error ? evaluationError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (e) {
    console.error("POST /api/evaluation/psychological 처리 중 예외 발생:", e);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
} 