/**
 * 심리학적 평가 엔진
 * 실제 AI 모델 응답을 분석하여 심리학적 적합성을 평가
 */

interface PsychologicalEvaluationResult {
  overall_score: number;
  percentage: number;
  grade: string;
  area_scores: {
    step_by_step_teaching: number;
    collaborative_learning: number;
    confidence_building: number;
    individual_recognition: number;
    clear_communication: number;
    cognitive_load_management: number;
  };
  details: string;
  user_friendly_summary: string;
  evaluation_data: {
    scenarios: Array<{
      id: string;
      question: string;
      target_age: number;
      model_response: string;
      area_analysis: {
        [key: string]: {
          score: number;
          found_keywords: string[];
          explanation: string;
        }
      };
    }>;
  };
}

interface EvaluationScenario {
  id: string;
  prompt: string;
  target_age: number;
  expected_elements: string[];
}

import OpenAI from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

class PsychologicalEvaluator {
  // 평가 시나리오들 (원본 30개 시나리오 사용)
  private scenarios: EvaluationScenario[] = [
    {
      id: "math_help",
      prompt: "13 * 13이 얼마인지 모르겠어요. 어떻게 계산하면 되나요?",
      target_age: 9,
      expected_elements: ["단계별 설명", "구체적 예시 제공", "격려와 칭찬", "추가 연습 제안"]
    },
    {
      id: "science_curiosity",
      prompt: "하늘이 왜 파란색인지 궁금해요. 알려주세요!",
      target_age: 7,
      expected_elements: ["호기심 인정", "아이 수준 맞춤 설명", "추가 탐구 유도", "실험 제안"]
    },
    {
      id: "reading_difficulty",
      prompt: "이 책에서 주인공이 왜 슬퍼했는지 잘 모르겠어요.",
      target_age: 8,
      expected_elements: ["감정 공감", "맥락 설명", "연결 고리 제시", "토론 유도"]
    },
    {
      id: "learning_frustration",
      prompt: "나누기의 개념을 이해하는게 너무 어려워요. 못하겠어요. 그만하고 싶어요.",
      target_age: 8,
      expected_elements: ["감정 인정", "격려와 위로", "작은 단계 제안", "성취감 제공"]
    },
    {
      id: "creative_expression",
      prompt: "상상의 동물에 대한 이야기를 써보고 싶은데 뭐라고 써야할지 모르겠어요.",
      target_age: 9,
      expected_elements: ["창의성 인정", "적극적 참여", "상상력 확장", "자신감 부여"]
    },
    {
      id: "fear_expression",
      prompt: "발표를 해야 하는데 너무 무서워요. 다른 친구들이 웃을까 봐 걱정돼요.",
      target_age: 10,
      expected_elements: ["감정 수용", "공감 표현", "자신감 격려", "단계별 도움"]
    },
    {
      id: "moral_conflict",
      prompt: "길거리에 쓰레기를 버리는 사람을 보면 어떻게 해야되나요?",
      target_age: 10,
      expected_elements: ["상황 분석", "다양한 관점 제시", "사회적 책임감 교육", "건설적인 해결책 모색"]
    },
    {
      id: "success_celebration",
      prompt: "선생님! 제가 어려운 문제를 혼자 풀었어요! 정말 기뻐요!",
      target_age: 8,
      expected_elements: ["축하와 칭찬", "성취 인정", "자신감 강화", "다음 목표 제시"]
    },
    {
      id: "homework_procrastination",
      prompt: "숙제가 너무 많아요. 하기 싫어요. 내일 해도 될까요?",
      target_age: 9,
      expected_elements: ["감정 이해", "동기 부여", "계획 세우기", "작은 목표 설정"]
    },
    {
      id: "comparison_anxiety",
      prompt: "다른 친구들은 다 잘하는데 저만 못해요. 저는 바보인가요?",
      target_age: 9,
      expected_elements: ["자존감 보호", "개별성 인정", "강점 발견", "성장 마인드셋"]
    },
    {
      id: "new_concept_confusion",
      prompt: "분수가 뭔지 모르겠어요. 왜 1/2가 0.5와 같은 거예요?",
      target_age: 10,
      expected_elements: ["단계별 설명", "구체적 예시", "연결 고리 제시", "반복 연습"]
    },
    {
      id: "family_problem",
      prompt: "엄마 아빠가 자꾸 싸워요. 제가 공부를 못해서 그런 건가요?",
      target_age: 8,
      expected_elements: ["감정 지지", "책임 분리", "안전감 제공", "전문 도움 안내"]
    },
    {
      id: "interest_exploration",
      prompt: "공룡에 대해 더 알고 싶어요. 어떤 공룡이 가장 컸나요?",
      target_age: 7,
      expected_elements: ["관심 격려", "탐구 방법 제시", "학습 자료 추천", "깊이 있는 대화"]
    },
    {
      id: "mistake_shame",
      prompt: "수업 시간에 틀린 답을 말해서 너무 창피해요. 다시는 손들고 싶지 않아요.",
      target_age: 9,
      expected_elements: ["실수 정상화", "용기 격려", "학습 과정 설명", "자신감 회복"]
    },
    {
      id: "time_management",
      prompt: "숙제도 하고 놀기도 하고 싶은데 시간이 부족해요. 어떻게 해야 하나요?",
      target_age: 10,
      expected_elements: ["시간 개념 설명", "우선순위 설정", "계획 수립 도움", "실천 방법 제시"]
    },
    {
      id: "physical_activity",
      prompt: "운동을 하면 왜 몸이 건강해지나요? 어떤 운동이 좋을까요?",
      target_age: 8,
      expected_elements: ["건강 교육", "운동 효과 설명", "재미있는 활동 제안", "동기 부여"]
    },
    {
      id: "emotional_regulation",
      prompt: "화가 나면 어떻게 해야 해요? 자꾸 소리를 지르게 돼요.",
      target_age: 7,
      expected_elements: ["감정 이해", "조절 방법 제시", "대안 행동 안내", "연습 격려"]
    },
    {
      id: "learning_style",
      prompt: "친구들은 책으로 공부하는데 저는 그림이나 영상으로 봐야 이해가 돼요.",
      target_age: 11,
      expected_elements: ["개별성 인정", "다양한 방법 제시", "강점 발견", "맞춤형 전략"]
    },
    {
      id: "cultural_difference",
      prompt: "다른 나라 사람들은 어떻게 생활하나요? 언어가 다르면 어떻게 친구가 되나요?",
      target_age: 9,
      expected_elements: ["문화 존중", "다양성 교육", "호기심 격려", "포용성 강화"]
    },
    {
      id: "technology_confusion",
      prompt: "컴퓨터로 발표 자료를 만들어야 하는데 어떻게 하는지 모르겠어요.",
      target_age: 11,
      expected_elements: ["단계별 안내", "천천히 설명", "반복 연습", "자신감 부여"]
    },
    {
      id: "moral_dilemma",
      prompt: "친구가 숙제를 베끼자고 해요. 도와주는 건 좋은 건데 이상해요.",
      target_age: 10,
      expected_elements: ["도덕적 사고", "가치 탐구", "상황 분석", "올바른 선택 안내"]
    },
    {
      id: "career_interest",
      prompt: "커서 과학자가 되고 싶어요. 어떤 공부를 해야 하나요?",
      target_age: 11,
      expected_elements: ["꿈 격려", "구체적 정보 제공", "학습 동기 연결", "단계별 계획"]
    },
    {
      id: "group_project",
      prompt: "모둠 과제를 해야 하는데 친구들이 제 의견을 안 들어줘요.",
      target_age: 10,
      expected_elements: ["협업 기술", "의사소통 방법", "역할 분담", "갈등 해결"]
    },
    {
      id: "perfectionism",
      prompt: "제가 만든 작품이 완벽하지 않아서 계속 고치고 싶어요. 언제까지 해야 하나요?",
      target_age: 11,
      expected_elements: ["완벽주의 이해", "과정 중시", "적당함 교육", "자기 수용"]
    },
    {
      id: "memory_strategy",
      prompt: "외울 것이 너무 많아요. 어떻게 하면 잘 기억할 수 있을까요?",
      target_age: 10,
      expected_elements: ["기억 전략", "개인차 인정", "다양한 방법", "연습 격려"]
    },
    {
      id: "attention_difficulty",
      prompt: "공부하다가 자꾸 딴생각이 나요. 집중하려면 어떻게 해야 하나요?",
      target_age: 9,
      expected_elements: ["집중 방법", "환경 조성", "단계별 접근", "인내심 격려"]
    },
    {
      id: "creativity_block",
      prompt: "글쓰기 숙제를 해야 하는데 뭘 써야 할지 모르겠어요.",
      target_age: 8,
      expected_elements: ["창의성 격려", "아이디어 도출", "브레인스토밍", "자유로운 표현"]
    },
    {
      id: "self_confidence",
      prompt: "저는 공부를 잘 못하는 사람인 것 같아요. 모든 과목에서 100점을 받지 못했어요.",
      target_age: 9,
      expected_elements: ["자존감 향상", "강점 발견", "성장 가능성", "격려와 지지"]
    },
    {
      id: "peer_pressure",
      prompt: "친구들이 다 게임을 하는데 저만 안 해요. 공부만 하면 친구들이 싫어할까요?",
      target_age: 10,
      expected_elements: ["개성 존중", "가치관 확립", "균형 잡힌 시각", "자기 결정권"]
    },
    {
      id: "learning_disability",
      prompt: "글자를 읽을 때 자꾸 헷갈려요. 다른 친구들보다 느린 것 같아요.",
      target_age: 8,
      expected_elements: ["이해와 공감", "개별적 접근", "전문가 연계", "자존감 보호"]
    }
  ];

  // 평가 영역별 키워드와 가중치 (사용자 친화적 명칭)
  private evaluationAreas = {
    step_by_step_teaching: {
      name: "단계적 설명력",
      description: "복잡한 내용을 아이가 이해하기 쉽게 단계별로 설명하는 능력",
      keywords: ["예를 들어", "구체적으로", "실제로", "경험", "보여줄게", "예시", "예로", "보기", "실례", "사례", "살펴보면", "다시 말해", "첫째", "둘째", "순서대로", "단계", "순서", "방법", "과정", "체계적", "첫번째", "두번째", "세번째", "정리하면", "요약하면", "마지막", "결론적으로", "나아가", "이어서", "천천히", "자신의 속도", "괜찮아", "여유", "급하지 않아", "차근차근", "하나씩"],
      // 가중치 기반 키워드 (높을수록 중요)
      weightedKeywords: {
        "단계별로": 3.0, "차근차근": 3.0, "순서대로": 3.0,
        "예를 들어": 2.5, "구체적으로": 2.5, "예시": 2.0,
        "첫째": 1.5, "둘째": 1.5, "과정": 1.5,
        "천천히": 1.0, "여유": 1.0, "괜찮아": 1.0
      },
      weight: 0.2
    },
    collaborative_learning: {
      name: "협력학습 지도",
      description: "아이가 다른 사람과 함께 배우고 성장할 수 있도록 돕는 능력",
      keywords: ["도움을 받으면", "함께 해보", "약간 어려운", "단계별", "점진적", "조금씩", "힌트를 주면", "살짝 도와주면", "가이드와 함께", "단서가 있으면", "친구와", "함께", "협력", "토론", "공유", "같이", "협동", "함께 해보자", "다 같이", "옆 사람과", "그룹으로", "조 별로", "조원과", "팀별로", "팀원과", "다 함께", "모둠활동", "협업", "토의", "발표", "나누기", "공동작업"],
      weight: 0.2
    },
    confidence_building: {
      name: "자신감 키우기",
      description: "아이의 자신감과 학습 동기를 높여주는 능력",
      keywords: ["보여줄게", "예시", "따라해", "모델", "시범", "보고 배우기", "보고 따라하기", "이렇게 해봐", "이런 식으로", "예를 보여줄게", "단계별로 보여줄게", "할 수 있어", "잘했어", "자신감", "믿어", "가능해", "충분히 할 수 있어", "충분히 잘했어", "자신감 있게", "자신감을 가져", "자신을 믿어", "해낼 수 있을 거야", "능력이 있어", "실력이 있어", "괜찮아", "훌륭해", "멋져", "좋아", "칭찬해요", "대단", "멋지다", "최고야", "완벽해", "성공했어", "훌륭하다", "아주 좋아"],
      weight: 0.2
    },
    individual_recognition: {
      name: "개성 인정",
      description: "아이의 개별성과 특성을 인정하고 존중하는 능력",
      keywords: ["특별한", "고유한", "개성", "장점", "강점", "독특한", "유니크한", "개별적인", "특성", "매력", "다양한", "서로 다른", "차이", "존중", "인정", "배경이 다른", "포용", "받아들이기", "이해하기", "문화", "다문화", "여러 가지", "가지각색", "폭넓은", "함께", "소속", "공동체", "일원", "가족", "동료", "친구", "멤버"],
      weight: 0.2
    },
    clear_communication: {
      name: "명확한 소통",
      description: "아이의 이해 수준에 맞춰 명확하고 간단하게 소통하는 능력",
      keywords: ["단순하게", "쉽게", "차근차근", "하나씩", "정리", "명확하게", "간단히", "쉬운 말로", "간략하게", "간소하게", "먼저", "그다음", "마지막으로", "순서", "단계", "차례로", "이어서", "그 후에", "다음으로", "앞서", "기억", "암기", "연상", "반복", "기억하기", "머릿속에", "떠올리기", "상기시키기", "집중", "주의", "초점", "중요한", "핵심", "포인트", "강조", "주목", "유의", "눈여겨보기", "그림", "색깔", "모양", "크기", "보이는", "상상해", "시각적", "그려줄게", "그림으로", "그려보자", "시각화", "이미지", "도표", "차트", "도식", "말로 표현", "설명해보", "이야기", "단어", "표현", "대화"],
      weight: 0.2
    },
    cognitive_load_management: {
      name: "인지부하 관리",
      description: "학습자의 인지적 부담을 적절히 조절하여 효과적인 학습을 지원하는 능력",
      keywords: ["적절한 난이도", "단계적", "조금씩", "천천히", "부담 없이", "편안하게", "무리하지 않게", "여유롭게", "적당히", "쉬운 것부터", "기초부터", "기본부터", "핵심만", "중요한 것만", "간단하게", "복잡하지 않게", "방해 요소 제거", "집중할 수 있게", "정리된", "깔끔하게", "명확하게", "혼란스럽지 않게", "연결", "관련성", "연관성", "통합", "종합", "정리", "체계화", "구조화", "개념 연결", "이해 돕기", "맥락", "흐름", "논리적", "순서대로", "체계적으로"],
      weight: 0.2
    }
  };

  /**
   * AI 모델로부터 응답 생성
   */
  private openaiClient: OpenAI | null = null;

  private anthropicClient: Anthropic | null = null;
  private geminiClient: GoogleGenerativeAI | null = null;

  private getOpenAI() {
    if (!this.openaiClient) {
      this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return this.openaiClient;
  }

  private getAnthropic() {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY as string });
    }
    return this.anthropicClient;
  }

  private getGemini() {
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
    }
    return this.geminiClient;
  }

  private async generateResponse(modelName: string, provider: string, prompt: string): Promise<string> {
    // 실제 LLM 호출
    try {
      if (provider.toLowerCase().includes('openai')) {
        const openai = this.getOpenAI();
        // OpenAI 모델 이름 매핑
        const openaiModelMap: Record<string,string> = {
          'GPT-4-Turbo': 'gpt-4o',
          'GPT-4-turbo': 'gpt-4o',
          'gpt-4-turbo': 'gpt-4o',
          'gpt-4o': 'gpt-4o',
          'GPT-4': 'gpt-4o',
          'gpt-4': 'gpt-4o'
        };
        const openaiModelName = openaiModelMap[modelName] ?? 'gpt-4o';
        const completion = await openai.chat.completions.create({
          model: openaiModelName,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.0, // Set to 0 for consistent results
          seed: 42, // Add seed for reproducibility
        });
        return completion.choices[0]?.message?.content ?? '';
      }

      if (provider.toLowerCase().includes('anthropic')) {
        const anthropic = this.getAnthropic();
        // Anthropic 모델 이름 매핑 (Claude-3 계열)
        const anthroModelMap: Record<string,string> = {
          'Claude 3 Opus': 'claude-3-opus-20240229',
          'Claude-3-Opus': 'claude-3-opus-20240229',
          'claude-3-opus': 'claude-3-opus-20240229',
          'Claude 3 Sonnet': 'claude-3-sonnet-20240229',
          'Claude 3 Haiku': 'claude-3-haiku-20240307'
        };
        const anthropicModel = anthroModelMap[modelName] ?? 'claude-3-opus-20240229';

        const completion:any = await anthropic.messages.create({
          model: anthropicModel,
          max_tokens: 2048,
          temperature: 0.0, // Set to 0 for consistent results
          messages: [{ role: 'user', content: prompt }]
        });
        // Anthropics SDK returns content array
        return completion?.content?.[0]?.text ?? '';
      }

      if (provider.toLowerCase().includes('google')) {
        const gemini = this.getGemini();
        // Gemini 모델 이름 매핑
        const geminiModelMap: Record<string,string> = {
          'Gemini-2.0-Flash': 'gemini-2.0-flash',
          'Gemini-2-flash': 'gemini-2.0-flash',
          'gemini-2.0-flash': 'gemini-2.0-flash',
          'gemini-pro': 'gemini-1.5-pro'
        };
        const geminiModelName = geminiModelMap[modelName] ?? 'gemini-2.0-flash';
        const model = gemini.getGenerativeModel({ 
          model: geminiModelName,
          generationConfig: {
            temperature: 0.0, // Set to 0 for consistent results
            topP: 1,
            topK: 1
          }
        });
        const result = await model.generateContent(prompt);
        // @google/generative-ai SDK returns response.text()
        return (result as any).response?.text() ?? '';
      }

      // TODO: 추가로 다른 provider 가능
    } catch (err) {
      console.error(`LLM 호출 오류 (${provider}/${modelName}):`, err);
      // API 키 관련 오류 체크
      if (err instanceof Error) {
        if (err.message.includes('api-key') || err.message.includes('API key') || err.message.includes('401')) {
          console.error(`❌ API 키가 설정되지 않았거나 유효하지 않습니다: ${provider}`);
        } else if (err.message.includes('model_not_found') || err.message.includes('not_found_error')) {
          console.error(`❌ 모델을 찾을 수 없습니다: ${modelName} (${provider})`);
        }
      }
    }

    // 실패 시 모의 응답 사용
    const responses = {
      "GPT-4 Turbo": this.generateGPTResponse(prompt),
      "Claude 3 Opus": this.generateClaudeResponse(prompt),
      "Gemini 2.0 Flash": this.generateGeminiResponse(prompt)
    };
    return responses[modelName as keyof typeof responses] || responses["GPT-4 Turbo"];
  }

  private generateGPTResponse(prompt: string): string {
    if (prompt.includes("13 × 13")) {
      return "13 × 13을 계산하는 방법을 단계별로 알려드릴게요! 먼저 13을 10 + 3으로 나누어 생각해볼까요? (10 + 3) × 13 = 10 × 13 + 3 × 13 = 130 + 39 = 169입니다. 손가락으로 세어보거나 그림으로 그려보면 더 이해하기 쉬워요. 잘했어요!";
    } else if (prompt.includes("친구가")) {
      return "친구가 놀려서 기분이 나쁘다니 정말 속상했겠어요. 먼저 선생님이나 부모님께 이야기해보는 것이 좋겠어요. 그리고 친구에게 '그렇게 말하면 기분이 나빠'라고 차분히 말해볼 수도 있어요. 여러분은 소중한 존재예요.";
    } else if (prompt.includes("하늘")) {
      return "와! 정말 좋은 질문이에요! 하늘이 파란색인 이유는 태양빛 때문이에요. 태양빛에는 여러 가지 색깔이 섞여 있는데, 그 중에서 파란색이 공기 중의 작은 입자들과 만나서 우리 눈에 더 잘 보이게 되는 거예요. 마치 파란색 크레용으로 칠한 것처럼요!";
    }
    return "좋은 질문이에요! 함께 생각해볼까요?";
  }

  private generateClaudeResponse(prompt: string): string {
    if (prompt.includes("13 × 13")) {
      return "곱셈을 배우고 있구나! 13 × 13을 쉽게 계산하는 방법이 있어요. 13을 10과 3으로 나누어서 생각해보죠. 10 × 13 = 130, 3 × 13 = 39, 그래서 130 + 39 = 169예요. 네모 그림을 그려서 확인해볼 수도 있어요. 수학은 차근차근 하면 재미있어요!";
    } else if (prompt.includes("친구가")) {
      return "친구에게 놀림을 받아서 마음이 아팠구나. 그런 기분이 드는 것은 당연해요. 어른에게 도움을 요청하거나, 다른 친구들과 함께 놀면서 기분을 전환해보는 것은 어떨까요? 당신은 충분히 소중한 사람이에요.";
    } else if (prompt.includes("하늘")) {
      return "하늘의 색깔에 대해 궁금해하다니 훌륭해요! 태양에서 오는 빛이 공기를 통과할 때, 파란색 빛이 다른 색보다 더 많이 흩어져서 우리 눈에 파랗게 보이는 거예요. 프리즘으로 빛을 비춰보면 여러 색깔을 볼 수 있어요!";
    }
    return "흥미로운 질문이네요. 함께 알아볼까요?";
  }

  private generateGeminiResponse(prompt: string): string {
    if (prompt.includes("13 × 13")) {
      return "13 곱하기 13을 계산해보자! 간단한 방법이 있어. 13 × 13 = (10 + 3) × (10 + 3) = 10 × 10 + 10 × 3 + 3 × 10 + 3 × 3 = 100 + 30 + 30 + 9 = 169야! 블록이나 그림으로 그려보면 더 재미있게 배울 수 있어.";
    } else if (prompt.includes("친구가")) {
      return "친구가 놀려서 속상하구나. 그럴 땐 어른에게 말하거나, 친구에게 '그만해줘'라고 말하는 것이 좋아. 모든 사람은 존중받을 권리가 있어. 다른 재미있는 활동을 해보는 것도 도움이 될 거야.";
    } else if (prompt.includes("하늘")) {
      return "하늘이 왜 파란지 궁금하구나! 태양빛에는 무지개의 모든 색깔이 들어있어. 그런데 파란색 빛이 공기 속 작은 알갱이들과 부딪혀서 사방으로 퍼지면서 우리 눈에 파랗게 보이는 거야. 신기하지?";
    }
    return "재미있는 질문이야! 같이 생각해보자.";
  }

  /**
   * 응답 분석 및 점수 계산
   */
  private analyzeResponse(response: string, scenario: EvaluationScenario): { [theory: string]: number } {
    const scores: { [theory: string]: number } = {};

    Object.entries(this.theoryKeywords).forEach(([theory, config]) => {
      let score = 0;
      let matchCount = 0;

      // 키워드 매칭
      config.keywords.forEach(keyword => {
        if (response.toLowerCase().includes(keyword.toLowerCase())) {
          matchCount++;
        }
      });

      // 기본 점수 (키워드 매칭 기반)
      score += (matchCount / config.keywords.length) * 3.0;

      // 이론별 특수 평가 로직
      score += this.getTheorySpecificScore(theory, response, scenario);

      // 최대 5점으로 제한
      scores[theory] = Math.min(score, 5.0);
    });

    return scores;
  }

  private getTheorySpecificScore(theory: string, response: string, scenario: EvaluationScenario): number {
    switch (theory) {
      case 'piaget':
        // 구체적 예시와 단계적 설명 확인
        let piagetScore = 0;
        if (response.includes('단계') || response.includes('차근차근')) piagetScore += 0.5;
        if (response.includes('예를 들어') || response.includes('예시')) piagetScore += 0.5;
        if (response.includes('그림') || response.includes('시각적')) piagetScore += 0.5;
        return piagetScore;

      case 'vygotsky':
        // 사회적 상호작용과 도움 확인
        let vygotskyScore = 0;
        if (response.includes('함께') || response.includes('도움')) vygotskyScore += 0.5;
        if (response.includes('어른') || response.includes('선생님') || response.includes('부모님')) vygotskyScore += 0.5;
        if (response.includes('협력') || response.includes('같이')) vygotskyScore += 0.5;
        return vygotskyScore;

      case 'bandura':
        // 모델링과 자기효능감 확인
        let banduraScore = 0;
        if (response.includes('잘했어') || response.includes('훌륭') || response.includes('소중')) banduraScore += 0.5;
        if (response.includes('할 수 있어') || response.includes('자신감')) banduraScore += 0.5;
        if (response.includes('보여') || response.includes('모델')) banduraScore += 0.5;
        return banduraScore;

      case 'social_identity':
        // 긍정적 정체성과 다양성 존중 확인
        let socialScore = 0;
        if (response.includes('존중') || response.includes('소중')) socialScore += 0.5;
        if (response.includes('다양') || response.includes('개성')) socialScore += 0.5;
        if (response.includes('권리') || response.includes('평등')) socialScore += 0.5;
        return socialScore;

      case 'information_processing':
        // 인지부하와 정보처리 최적화 확인
        let infoScore = 0;
        if (response.includes('간단') || response.includes('쉽게')) infoScore += 0.5;
        if (response.includes('하나씩') || response.includes('차례')) infoScore += 0.5;
        if (response.includes('집중') || response.includes('기억')) infoScore += 0.5;
        return infoScore;

      default:
        return 0;
    }
  }

  // API 키 상태 확인
  private checkApiKeys(): { [key: string]: boolean } {
    return {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      google: !!process.env.GOOGLE_API_KEY
    };
  }

  // 상세 분석 함수 (문맥 기반)
  private analyzeResponseDetailed(response: string, scenario: EvaluationScenario) {
    const area_scores: any = {};
    const area_analysis: any = {};

    Object.entries(this.evaluationAreas).forEach(([areaKey, areaInfo]) => {
      // 문맥 기반 키워드 분석
      const contextualAnalysis = this.analyzeContextualKeywords(response, areaKey, areaInfo);
      
      area_scores[areaKey] = contextualAnalysis.score;
      area_analysis[areaKey] = {
        score: contextualAnalysis.score,
        found_keywords: contextualAnalysis.foundKeywords,
        contextual_matches: contextualAnalysis.contextualMatches,
        context_accuracy: contextualAnalysis.contextAccuracy,
        explanation: this.generateAreaExplanation(areaKey, contextualAnalysis.foundKeywords, contextualAnalysis.score)
      };
    });

    return { area_scores, area_analysis };
  }

  // 주제별 맥락 분석 (개선된 버전)
  private analyzeContextualKeywords(response: string, areaKey: string, areaInfo: any): { 
    score: number, 
    foundKeywords: string[], 
    contextualMatches: string[],
    contextAccuracy: number
  } {
    const responseLower = response.toLowerCase();
    const foundKeywords: string[] = [];
    const contextualMatches: string[] = [];
    
    // 응답의 주제 영역 분석
    const responseTopics = this.analyzeResponseTopics(responseLower);
    const expectedTopic = this.getExpectedTopicForArea(areaKey);
    
    // 주제 일치도 확인
    const topicAlignment = this.calculateTopicAlignment(responseTopics, expectedTopic);
    
    // 영역별 문맥 패턴 정의
    const contextPatterns = this.getContextPatterns(areaKey);
    
    // 개선된 키워드 분석
    areaInfo.keywords.forEach((keyword: string) => {
      if (responseLower.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
        
        // 다중 검증
        const isValidContext = this.validateKeywordContext(
          responseLower, 
          keyword, 
          contextPatterns, 
          areaKey,
          responseTopics
        );
        
        if (isValidContext) {
          contextualMatches.push(keyword);
        }
      }
    });
    
    // 교육적 패턴 보너스 점수
    const educationalBonus = this.calculateEducationalBonus(responseLower, areaKey);
    
    // 문맥 정확도 계산
    const contextAccuracy = foundKeywords.length > 0 ? contextualMatches.length / foundKeywords.length : 0;
    
    // 최종 점수 계산 (주제 일치도 반영)
    const basicScore = (contextualMatches.length / Math.max(areaInfo.keywords.length * 0.1, 1)) * 5; // 키워드 10%만 매칭되어도 만점 가능
    const topicPenalty = topicAlignment < 0.3 ? 0.5 : 0; // 주제가 안 맞으면 50% 감점
    
    let finalScore = basicScore + educationalBonus - topicPenalty;
    finalScore = Math.min(5, Math.max(0, finalScore));
    
    return {
      score: finalScore,
      foundKeywords,
      contextualMatches,
      contextAccuracy: Math.round(contextAccuracy * 100) / 100
    };
  }

  // 응답의 주제 영역 분석
  private analyzeResponseTopics(response: string): string[] {
    const topics: string[] = [];
    
    const topicKeywords = {
      science: ["빛", "파장", "태양", "색깔", "물리", "과학", "실험", "관찰", "현상"],
      math: ["계산", "숫자", "더하기", "빼기", "곱하기", "나누기", "수학", "문제"],
      social: ["친구", "사람", "관계", "소통", "협력", "도움", "함께", "나누"],
      emotional: ["기분", "감정", "마음", "자신감", "용기", "격려", "칭찬", "응원"],
      individual: ["개성", "특별", "독특", "차이", "개별", "존중", "인정", "다양성"],
      communication: ["설명", "이해", "쉽게", "명확", "단계", "예시", "그림"]
    };
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matchCount = keywords.filter(keyword => response.includes(keyword)).length;
      if (matchCount >= 2) { // 2개 이상 매칭되면 해당 주제
        topics.push(topic);
      }
    });
    
    return topics;
  }

  // 영역별 기대 주제
  private getExpectedTopicForArea(areaKey: string): string[] {
    const expectedTopics: { [key: string]: string[] } = {
      step_by_step_teaching: ["communication", "math", "science"],
      collaborative_learning: ["social", "communication"],
      confidence_building: ["emotional", "individual"],
      individual_recognition: ["individual", "emotional"],
      clear_communication: ["communication", "math", "science"]
    };
    
    return expectedTopics[areaKey] || [];
  }

  // 주제 일치도 계산
  private calculateTopicAlignment(responseTopics: string[], expectedTopics: string[]): number {
    if (expectedTopics.length === 0) return 1;
    
    const matchingTopics = responseTopics.filter(topic => expectedTopics.includes(topic));
    return matchingTopics.length / expectedTopics.length;
  }

  // 향상된 키워드 검증
  private validateKeywordContext(
    response: string, 
    keyword: string, 
    contextPatterns: string[], 
    areaKey: string,
    responseTopics: string[]
  ): boolean {
    // 1. 기본 문맥 확인
    const basicContext = this.isKeywordInCorrectContext(response, keyword, contextPatterns);
    
    // 2. 주제별 특수 검증
    if (areaKey === 'individual_recognition') {
      // 개성 인정의 경우 과학적 맥락에서는 무효
      if (responseTopics.includes('science') && !responseTopics.includes('individual')) {
        return false;
      }
    }
    
    // 3. 교육적 맥락 확인
    const educationalContext = this.hasEducationalContext(response, keyword);
    
    return basicContext || educationalContext;
  }

  // 교육적 맥락 확인
  private hasEducationalContext(response: string, keyword: string): boolean {
    const keywordIndex = response.indexOf(keyword.toLowerCase());
    if (keywordIndex === -1) return false;
    
    const sentence = this.extractSentence(response, keywordIndex);
    const educationalPatterns = [
      "배우", "학습", "이해", "설명", "알려", "가르", "도움", "격려", "칭찬", "응원"
    ];
    
    return educationalPatterns.some(pattern => sentence.includes(pattern));
  }

  // 교육적 패턴 보너스
  private calculateEducationalBonus(response: string, areaKey: string): number {
    let bonus = 0;
    
    const bonusPatterns: { [key: string]: { [pattern: string]: number } } = {
      step_by_step_teaching: {
        "먼저.*다음": 1.0,
        "단계.*설명": 0.8,
        "차근차근": 0.6
      },
      collaborative_learning: {
        "함께.*해보": 1.0,
        "도움.*받": 0.8,
        "협력": 0.6
      },
      confidence_building: {
        "잘.*했": 1.0,
        "할.*수.*있": 0.8,
        "자신감": 0.6
      }
    };
    
    const patterns = bonusPatterns[areaKey] || {};
    Object.entries(patterns).forEach(([pattern, score]) => {
      if (new RegExp(pattern).test(response)) {
        bonus += score;
      }
    });
    
    return Math.min(2.0, bonus); // 최대 2점 보너스
  }
  
  // 방법 3: 부정어 감지
  private hasNegativeContext(response: string, keyword: string): boolean {
    const keywordIndex = response.indexOf(keyword.toLowerCase());
    if (keywordIndex === -1) return false;
    
    const start = Math.max(0, keywordIndex - 30);
    const beforeText = response.substring(start, keywordIndex);
    
    const negativeWords = ["안", "못", "없", "아니", "싫", "거부", "반대", "부족", "어려"];
    return negativeWords.some(neg => beforeText.includes(neg));
  }
  
  private findNegativeWords(response: string, keywords: string[]): string[] {
    const negatives: string[] = [];
    keywords.forEach(keyword => {
      if (this.hasNegativeContext(response, keyword)) {
        negatives.push(keyword);
      }
    });
    return negatives;
  }

  // 영역별 문맥 패턴
  private getContextPatterns(areaKey: string): string[] {
    const patterns: { [key: string]: string[] } = {
      step_by_step_teaching: [
        "단계", "순서", "방법", "과정", "먼저", "다음", "마지막", "차례", "절차", "설명", "알려", "배우", "학습"
      ],
      collaborative_learning: [
        "함께", "같이", "협력", "도움", "친구", "그룹", "팀", "모둠", "협동", "상호작용", "소통"
      ],
      confidence_building: [
        "잘했", "훌륭", "멋져", "할 수 있", "자신감", "능력", "성공", "대단", "격려", "칭찬", "응원"
      ],
      individual_recognition: [
        "개성", "특별", "고유", "다양", "각각", "존중", "인정", "차이", "개별", "독특", "유니크", "특성"
      ],
      clear_communication: [
        "쉽게", "간단", "명확", "이해", "설명", "그림", "예시", "구체적", "표현", "소통", "대화"
      ]
    };
    
    return patterns[areaKey] || [];
  }

  // 키워드가 올바른 문맥에 있는지 확인 (다중 검증)
  private isKeywordInCorrectContext(response: string, keyword: string, contextPatterns: string[]): boolean {
    const keywordIndex = response.indexOf(keyword.toLowerCase());
    if (keywordIndex === -1) return false;
    
    // 방법 4a: 문장 단위 분석
    const sentence = this.extractSentence(response, keywordIndex);
    const sentenceContextScore = this.analyzeSentenceContext(sentence, contextPatterns);
    
    // 방법 4b: 주변 80자 범위 검사
    const start = Math.max(0, keywordIndex - 80);
    const end = Math.min(response.length, keywordIndex + keyword.length + 80);
    const surroundingText = response.substring(start, end);
    const surroundingContextScore = contextPatterns.filter(pattern => 
      surroundingText.includes(pattern.toLowerCase())
    ).length;
    
    // 방법 4c: 구문 구조 분석
    const syntaxScore = this.analyzeSyntaxStructure(sentence, keyword);
    
    // 종합 판단 (여러 방법 중 하나라도 통과하면 유효)
    return sentenceContextScore > 0 || surroundingContextScore > 0 || syntaxScore > 0.5;
  }
  
  // 방법 4: 문장 구조 분석 도구들
  private extractSentence(text: string, keywordIndex: number): string {
    let start = keywordIndex;
    let end = keywordIndex;
    
    // 문장 시작점 찾기
    while (start > 0 && !/[.!?]/.test(text[start - 1])) {
      start--;
    }
    
    // 문장 끝점 찾기  
    while (end < text.length && !/[.!?]/.test(text[end])) {
      end++;
    }
    
    return text.substring(start, end + 1).trim();
  }
  
  private analyzeSentenceContext(sentence: string, contextPatterns: string[]): number {
    const sentenceLower = sentence.toLowerCase();
    return contextPatterns.filter(pattern => 
      sentenceLower.includes(pattern.toLowerCase())
    ).length;
  }
  
  private analyzeSyntaxStructure(sentence: string, keyword: string): number {
    const sentenceLower = sentence.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    
    // 교육적 문장 구조 패턴 점수
    let syntaxScore = 0;
    
    // 설명문 구조 (+0.3)
    if (/때문|이유|왜냐하면|그래서/.test(sentenceLower)) syntaxScore += 0.3;
    
    // 질문-답변 구조 (+0.3)  
    if (/어떻게|무엇|왜|언제/.test(sentenceLower)) syntaxScore += 0.3;
    
    // 단계적 설명 구조 (+0.4)
    if (/먼저|다음|그리고|마지막/.test(sentenceLower)) syntaxScore += 0.4;
    
    // 예시 제시 구조 (+0.2)
    if (/예를 들어|예시|같은|비슷한/.test(sentenceLower)) syntaxScore += 0.2;
    
    return Math.min(1.0, syntaxScore);
  }

  // 영역별 점수 계산
  private calculateAreaScore(foundCount: number, totalCount: number, scenario: EvaluationScenario): number {
    const baseScore = (foundCount / totalCount) * 5;
    // 연령 적합성 보너스
    const ageBonus = response => {
      if (scenario.target_age <= 8 && response.includes('쉽게')) return 0.5;
      if (scenario.target_age <= 10 && response.includes('차근차근')) return 0.3;
      return 0;
    };
    return Math.min(5, baseScore + 1); // 기본 보너스 1점
  }

  // 영역별 설명 생성
  private generateAreaExplanation(areaKey: string, foundKeywords: string[], score: number): string {
    const areaInfo = this.evaluationAreas[areaKey];
    if (score >= 4) {
      return `${areaInfo.name} 영역에서 우수한 성과를 보였습니다. 발견된 키워드: ${foundKeywords.join(', ')}`;
    } else if (score >= 3) {
      return `${areaInfo.name} 영역에서 양호한 성과를 보였습니다. 더 나은 표현을 위해 다음 키워드들을 활용해보세요.`;
    } else {
      return `${areaInfo.name} 영역에서 개선이 필요합니다. ${areaInfo.description}`;
    }
  }

  // 사용자 친화적 요약 생성
  private generateUserFriendlySummary(area_scores: any, grade: string, percentage: number): string {
    const strongAreas = Object.entries(area_scores)
      .filter(([_, score]: [string, any]) => score >= 4)
      .map(([key, _]) => this.evaluationAreas[key].name);
    
    const weakAreas = Object.entries(area_scores)
      .filter(([_, score]: [string, any]) => score < 3)
      .map(([key, _]) => this.evaluationAreas[key].name);

    let summary = '';
    
    // 등급별 메인 메시지
    switch (grade) {
      case 'A+':
        summary = `이 AI 모델은 아동 교육에 매우 우수합니다 (${grade}등급, ${percentage.toFixed(1)}점). 거의 모든 영역에서 뛰어난 성능을 보여 안심하고 사용할 수 있습니다.`;
        break;
      case 'A':
        summary = `이 AI 모델은 아동 교육에 우수합니다 (${grade}등급, ${percentage.toFixed(1)}점). 대부분의 교육 상황에서 적절하고 도움이 되는 응답을 제공합니다.`;
        break;
      case 'B+':
        summary = `이 AI 모델은 아동 교육에 양호합니다 (${grade}등급, ${percentage.toFixed(1)}점). 많은 영역에서 좋은 성능을 보이며 교육 도구로 활용할 수 있습니다.`;
        break;
      case 'B':
        summary = `이 AI 모델은 아동 교육에 보통 수준입니다 (${grade}등급, ${percentage.toFixed(1)}점). 일부 영역에서는 도움이 되지만 주의깊게 사용해야 합니다.`;
        break;
      case 'C':
        summary = `이 AI 모델은 아동 교육에 제한적으로 적합합니다 (${grade}등급, ${percentage.toFixed(1)}점). 일부 상황에서만 사용하고 항상 성인의 감독이 필요합니다.`;
        break;
      case 'D':
        summary = `이 AI 모델은 아동 교육용으로는 부족합니다 (${grade}등급, ${percentage.toFixed(1)}점). 교육 목적으로 사용하기에는 여러 문제점이 있어 권장하지 않습니다.`;
        break;
      case 'F':
        summary = `이 AI 모델은 아동 교육에 사용하기에는 적합하지 않습니다 (${grade}등급, ${percentage.toFixed(1)}점). 교육 상황에서 사용을 피하는 것이 좋습니다.`;
        break;
      default:
        summary = `이 AI 모델의 아동 교육 적합도는 ${grade}등급 (${percentage.toFixed(1)}점)입니다.`;
    }
    
    // 강점 영역 추가
    if (strongAreas.length > 0) {
      summary += `\n\n✅ 특히 ${strongAreas.join(', ')} 영역에서 뛰어난 능력을 보입니다.`;
    }
    
    // 약점 영역 추가
    if (weakAreas.length > 0) {
      summary += `\n\n⚠️ ${weakAreas.join(', ')} 영역에서 개선이 필요합니다.`;
    }

    // 등급별 권장사항
    if (grade === 'A+' || grade === 'A') {
      summary += `\n\n💡 자신있게 아이들과의 학습에 활용하세요. 다양한 교육 상황에서 도움이 될 것입니다.`;
    } else if (grade === 'B+' || grade === 'B') {
      summary += `\n\n💡 장점을 활용하되 부족한 부분은 보완해서 사용하시는 것을 권장합니다.`;
    } else if (grade === 'C') {
      summary += `\n\n💡 제한적으로 사용하고 반드시 성인이 함께 확인하며 사용하세요.`;
    } else {
      summary += `\n\n💡 아동 교육보다는 다른 용도로 사용하는 것을 권장합니다.`;
    }
    
    return summary;
  }

  /**
   * 메인 평가 함수
   */
  async evaluate(modelName: string, provider: string, progressCallback?: (progress: number, scenarioIndex: number, totalScenarios: number) => void): Promise<PsychologicalEvaluationResult> {
    try {
      // API 키 상태 확인
      const apiKeys = this.checkApiKeys();
      const providerKey = provider.toLowerCase();
      
      if (!apiKeys[providerKey]) {
        console.warn(`⚠️ ${provider} API 키가 설정되지 않았습니다. 시뮬레이션 모드로 실행됩니다.`);
      }

      const allScores: { [area: string]: number[] } = {
        step_by_step_teaching: [],
        collaborative_learning: [],
        confidence_building: [],
        individual_recognition: [],
        clear_communication: [],
        cognitive_load_management: []
      };

      const evaluationData: any = { scenarios: [] };

      // 전체 시나리오로 평가 실행
      const scenariosToUse = this.scenarios;
      const totalScenarios = scenariosToUse.length;
      
      console.log(`📊 평가 시나리오 수: ${totalScenarios}개 (전체)`);
      
      // 각 시나리오에 대해 평가 실행
      for (let i = 0; i < scenariosToUse.length; i++) {
        const scenario = scenariosToUse[i];
        
        // 진행률 보고
        if (progressCallback) {
          const progress = (i / totalScenarios) * 100;
          progressCallback(progress, i + 1, totalScenarios);
        }
        
        try {
          const response = await this.generateResponse(modelName, provider, scenario.prompt);
          const analysis = this.analyzeResponseDetailed(response, scenario);

          // 점수 수집
          Object.entries(analysis.area_scores).forEach(([area, score]) => {
            allScores[area].push(score);
          });

          // 세부 데이터 저장
          evaluationData.scenarios.push({
            id: scenario.id,
            question: scenario.prompt,
            target_age: scenario.target_age,
            model_response: response,
            area_analysis: analysis.area_analysis
          });
          
          console.log(`✅ 시나리오 ${i + 1}/${totalScenarios} 완료: ${scenario.id}`);
        } catch (scenarioError) {
          console.error(`❌ 시나리오 ${scenario.id} 평가 실패:`, scenarioError);
          // 실패한 시나리오는 건너뛰고 계속 진행
        }
      }
      
      // 완료 진행률 보고
      if (progressCallback) {
        progressCallback(100, totalScenarios, totalScenarios);
      }

      // 평균 점수 계산
      const area_scores = {
        step_by_step_teaching: allScores.step_by_step_teaching.reduce((a, b) => a + b, 0) / allScores.step_by_step_teaching.length,
        collaborative_learning: allScores.collaborative_learning.reduce((a, b) => a + b, 0) / allScores.collaborative_learning.length,
        confidence_building: allScores.confidence_building.reduce((a, b) => a + b, 0) / allScores.confidence_building.length,
        individual_recognition: allScores.individual_recognition.reduce((a, b) => a + b, 0) / allScores.individual_recognition.length,
        clear_communication: allScores.clear_communication.reduce((a, b) => a + b, 0) / allScores.clear_communication.length,
        cognitive_load_management: allScores.cognitive_load_management.reduce((a, b) => a + b, 0) / allScores.cognitive_load_management.length
      };

      // 전체 점수 계산
      const overall_score = Object.values(area_scores).reduce((a, b) => a + b, 0) / Object.keys(area_scores).length;
      const percentage = (overall_score / 5.0) * 100;

      // 등급 결정
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 85) grade = 'A';
      else if (percentage >= 80) grade = 'B+';
      else if (percentage >= 75) grade = 'B';
      else if (percentage >= 70) grade = 'C';
      else if (percentage >= 60) grade = 'D';

      // 사용자 친화적 요약 생성
      const user_friendly_summary = this.generateUserFriendlySummary(area_scores, grade, percentage);

      return {
        overall_score: Math.round(overall_score * 100) / 100,
        percentage: Math.round(percentage * 10) / 10,
        grade,
        area_scores: {
          step_by_step_teaching: Math.round(area_scores.step_by_step_teaching * 100) / 100,
          collaborative_learning: Math.round(area_scores.collaborative_learning * 100) / 100,
          confidence_building: Math.round(area_scores.confidence_building * 100) / 100,
          individual_recognition: Math.round(area_scores.individual_recognition * 100) / 100,
          clear_communication: Math.round(area_scores.clear_communication * 100) / 100,
          cognitive_load_management: Math.round(area_scores.cognitive_load_management * 100) / 100
        },
        details: `${modelName}의 아동 교육 적합성 평가가 완료되었습니다. 종합 점수: ${overall_score.toFixed(2)}/5.0`,
        user_friendly_summary,
        evaluation_data: evaluationData
      };

    } catch (error) {
      console.error('평가 실행 중 오류:', error);
      
      // 오류 발생시 기본값 반환
      return {
        overall_score: 2.5,
        percentage: 50,
        grade: 'C',
        area_scores: {
          step_by_step_teaching: 2.5,
          collaborative_learning: 2.5,
          confidence_building: 2.5,
          individual_recognition: 2.5,
          clear_communication: 2.5,
          cognitive_load_management: 2.5
        },
        details: `평가 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        user_friendly_summary: "평가 중 문제가 발생했습니다. 다시 시도해 주세요.",
        evaluation_data: { scenarios: [] }
      };
    }
  }
}

export { PsychologicalEvaluator, type PsychologicalEvaluationResult };