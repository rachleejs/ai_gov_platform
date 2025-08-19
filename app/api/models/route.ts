import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import commercialModels from '@/data/commercialModels.json';

export async function GET(request: Request) {
  try {
    console.log("GET /api/models 요청 받음");
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    
    // 상용 모델 카탈로그 요청인 경우
    if (source === 'commercial') {
      console.log("상용 모델 카탈로그 반환");
      return NextResponse.json(commercialModels);
    }
    
    const cookieStore = cookies();
    
    try {
      console.log("Supabase 클라이언트 생성 시도");
      const supabase = createClient(cookieStore);
      console.log("Supabase 클라이언트 생성 성공");

      // 인증 세션 확인 (필요한 경우)
      const { data: { session } } = await supabase.auth.getSession();
      console.log("세션 정보:", session ? "인증됨" : "인증되지 않음");

      // 테이블 존재 여부 확인
      console.log("ai_models 테이블 존재 여부 확인");
      const { error: tableError } = await supabase.from('ai_models').select('count').limit(1);
      
      if (tableError) {
        console.error('ai_models 테이블 접근 오류:', tableError);
        // 테이블 접근 오류 시 테스트 데이터 반환
        console.log("테이블 접근 오류로 테스트 데이터 반환");
        // Use standardized model IDs that match what we expect in our code
        const testModels = [
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', model_type: 'LLM', is_active: true },
          { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', model_type: 'LLM', is_active: true },
          { id: 'gemini-2-flash', name: 'Gemini 2 Flash', provider: 'Google', model_type: 'LLM', is_active: true }
        ];
        return NextResponse.json(testModels);
      }

      // 모델 데이터 가져오기
      console.log("ai_models 테이블에서 데이터 조회 시작");
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching models:', error);
        // 데이터 조회 오류 시 테스트 데이터 반환
        console.log("데이터 조회 오류로 테스트 데이터 반환");
        const testModels = [
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', model_type: 'LLM', is_active: true },
          { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', model_type: 'LLM', is_active: true },
          { id: 'gemini-2-flash', name: 'Gemini 2 Flash', provider: 'Google', model_type: 'LLM', is_active: true }
        ];
        return NextResponse.json(testModels);
      }

      console.log("모델 데이터 가져오기 성공:", data.length, "개 모델");
      
      // 실제 데이터베이스 데이터 반환
      if (data.length > 0) {
        return NextResponse.json(data);
      } else {
        // 데이터가 없을 경우 테스트 데이터 반환
        console.log("데이터가 없어 테스트 데이터 반환");
        const testModels = [
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', model_type: 'LLM', is_active: true },
          { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', model_type: 'LLM', is_active: true },
          { id: 'gemini-2-flash', name: 'Gemini 2 Flash', provider: 'Google', model_type: 'LLM', is_active: true }
        ];
        return NextResponse.json(testModels);
      }
    } catch (dbError) {
      console.error("Supabase 작업 중 오류 발생:", dbError);
      // 데이터베이스 작업 오류 시 테스트 데이터 반환
      console.log("데이터베이스 작업 오류로 테스트 데이터 반환");
      const testModels = [
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', model_type: 'LLM', is_active: true },
        { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', model_type: 'LLM', is_active: true },
        { id: 'gemini-2-flash', name: 'Gemini 2 Flash', provider: 'Google', model_type: 'LLM', is_active: true }
      ];
      return NextResponse.json(testModels);
    }
  } catch (e) {
    console.error("GET /api/models 처리 중 예외 발생:", e);
    // 일반 오류 시 테스트 데이터 반환
    console.log("일반 오류로 테스트 데이터 반환");
    const testModels = [
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', model_type: 'LLM', is_active: true },
      { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', model_type: 'LLM', is_active: true },
      { id: 'gemini-2-flash', name: 'Gemini 2 Flash', provider: 'Google', model_type: 'LLM', is_active: true }
    ];
    return NextResponse.json(testModels);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const body = await req.json();
    const { 
      name,
      provider = 'Custom',
      model_type = 'Custom',
      description = '',
      version,
      context_window = 4096,
      max_tokens = 2048,
      // api_endpoint 필드 제거
      api_key_required = true,
      authentication_type = 'Bearer',
      supports_streaming = false,
      supported_formats = ['text'],
      input_cost_per_token,
      output_cost_per_token,
      is_custom_model = false,
      custom_config
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // 비용 정보 유효성 검사
    if (input_cost_per_token && isNaN(parseFloat(input_cost_per_token))) {
      return NextResponse.json({ error: 'input_cost_per_token must be a valid number' }, { status: 400 });
    }
    if (output_cost_per_token && isNaN(parseFloat(output_cost_per_token))) {
      return NextResponse.json({ error: 'output_cost_per_token must be a valid number' }, { status: 400 });
    }

    // 테이블 스키마에 맞게 필드 조정
    const modelData = {
      name,
      provider,
      model_type,
      description,
      version,
      context_window: parseInt(context_window) || 4096,
      max_tokens: parseInt(max_tokens) || 2048,
      // api_endpoint 필드 제거
      api_key_required: Boolean(api_key_required),
      authentication_type,
      supports_streaming: Boolean(supports_streaming),
      supported_formats: Array.isArray(supported_formats) ? supported_formats : ['text'],
      input_cost_per_token: input_cost_per_token ? parseFloat(input_cost_per_token) : null,
      output_cost_per_token: output_cost_per_token ? parseFloat(output_cost_per_token) : null,
      is_custom_model: Boolean(is_custom_model),
      custom_config: custom_config || null,
      is_active: true // is_active 필드 추가
    };

    const { data, error } = await supabase
      .from('ai_models')
      .insert([modelData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ model: data }, { status: 201 });
  } catch (e) {
    console.error("POST /api/models 처리 중 예외 발생:", e);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
} 