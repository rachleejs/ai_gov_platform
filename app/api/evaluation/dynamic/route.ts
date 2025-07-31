// 동적 평가 시스템을 위한 통합 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { DynamicEvaluationEngine, DynamicEvaluationResult } from '@/lib/dynamicEvaluationEngine';
import { PREDEFINED_TEMPLATES, getTemplateById, EvaluationTemplate } from '@/lib/evaluationTemplates';

interface DynamicEvaluationRequest {
  modelId: string;
  templateId: string;
  customTemplate?: EvaluationTemplate; // 사용자 정의 템플릿
}

interface DynamicEvaluationResponse {
  success: boolean;
  data?: DynamicEvaluationResult;
  error?: string;
  availableTemplates?: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
  }>;
}

// GET: 사용 가능한 평가 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/evaluation/dynamic - 템플릿 목록 요청");
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let templates = PREDEFINED_TEMPLATES;
    
    // 카테고리 필터링
    if (category && category !== 'all') {
      templates = templates.filter(template => template.category === category);
    }
    
    const availableTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category
    }));
    
    return NextResponse.json({
      success: true,
      availableTemplates
    } as DynamicEvaluationResponse);
    
  } catch (error) {
    console.error('Error fetching evaluation templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' } as DynamicEvaluationResponse,
      { status: 500 }
    );
  }
}

// POST: 동적 평가 실행
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/evaluation/dynamic - 평가 실행 요청");
    
    // 인증 확인
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as DynamicEvaluationResponse,
        { status: 401 }
      );
    }
    
    const body: DynamicEvaluationRequest = await request.json();
    const { modelId, templateId, customTemplate } = body;
    
    if (!modelId || (!templateId && !customTemplate)) {
      return NextResponse.json(
        { success: false, error: 'modelId and templateId (or customTemplate) are required' } as DynamicEvaluationResponse,
        { status: 400 }
      );
    }
    
    // 평가 템플릿 결정
    let template: EvaluationTemplate | undefined;
    
    if (customTemplate) {
      template = customTemplate;
      console.log(`🎨 Using custom template: ${template.name}`);
    } else {
      template = getTemplateById(templateId);
      console.log(`📋 Using predefined template: ${templateId}`);
    }
    
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' } as DynamicEvaluationResponse,
        { status: 404 }
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
        { success: false, error: 'Model not found' } as DynamicEvaluationResponse,
        { status: 404 }
      );
    }
    
    console.log(`🤖 Evaluating model: ${model.name} with template: ${template.name}`);
    
    // 평가 실행
    const evaluationEngine = new DynamicEvaluationEngine();
    const result = await evaluationEngine.executeEvaluation(template, modelId);
    
    // 결과를 데이터베이스에 저장
    try {
      const { data: savedResult, error: saveError } = await supabase
        .from('dynamic_evaluations')
        .insert([
          {
            model_id: modelId,
            user_id: session.user.id,
            template_id: template.id,
            template_name: template.name,
            total_score: result.totalScore,
            grade: result.grade,
            detailed_scores: result.detailedScores,
            prompt_results: result.promptResults,
            timestamp: result.timestamp.toISOString()
          }
        ])
        .select()
        .single();
        
      if (saveError) {
        console.error('Error saving evaluation result:', saveError);
        // 저장 실패해도 평가 결과는 반환
      } else {
        console.log('✅ Evaluation result saved to database');
      }
    } catch (dbError) {
      console.error('Database save error:', dbError);
      // 데이터베이스 오류가 있어도 평가 결과는 반환
    }
    
    return NextResponse.json({
      success: true,
      data: result
    } as DynamicEvaluationResponse);
    
  } catch (error) {
    console.error('Error executing dynamic evaluation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Evaluation failed' 
      } as DynamicEvaluationResponse,
      { status: 500 }
    );
  }
}

// PUT: 사용자 정의 템플릿 저장 (향후 확장)
export async function PUT(request: NextRequest) {
  try {
    console.log("PUT /api/evaluation/dynamic - 커스텀 템플릿 저장");
    
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as DynamicEvaluationResponse,
        { status: 401 }
      );
    }
    
    const template: EvaluationTemplate = await request.json();
    
    // 사용자 정의 템플릿을 데이터베이스에 저장
    const { data, error } = await supabase
      .from('custom_evaluation_templates')
      .insert([
        {
          user_id: session.user.id,
          template_id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          template_data: template
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving custom template:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save template' } as DynamicEvaluationResponse,
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { templateId: template.id, message: 'Template saved successfully' }
    } as DynamicEvaluationResponse);
    
  } catch (error) {
    console.error('Error saving custom template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save template' } as DynamicEvaluationResponse,
      { status: 500 }
    );
  }
} 