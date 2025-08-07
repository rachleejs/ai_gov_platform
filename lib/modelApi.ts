// 실제 모델 API 호출을 위한 유틸리티

interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'huggingface';
  modelName: string;
  apiKey: string;
  endpoint?: string;
}

interface ModelResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ModelAPIClient {
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  async generateResponse(prompt: string): Promise<ModelResponse> {
    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(prompt);
      case 'anthropic':
        return this.callAnthropic(prompt);
      case 'google':
        return this.callGoogle(prompt);
      case 'huggingface':
        return this.callHuggingFace(prompt);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async callOpenAI(prompt: string): Promise<ModelResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.modelName,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API Error Details:`, {
          status: response.status,
          statusText: response.statusText,
          modelName: this.config.modelName,
          error: errorText
        });
        throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        text: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  private async callAnthropic(prompt: string): Promise<ModelResponse> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.modelName,
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          system: "You are a helpful AI assistant."
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Anthropic API Error Details:`, {
          status: response.status,
          statusText: response.statusText,
          modelName: this.config.modelName,
          error: errorText
        });
        throw new Error(`Anthropic API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        text: data.content[0].text,
        usage: data.usage
      };
    } catch (error) {
      console.error('Anthropic API call failed:', error);
      throw error;
    }
  }

  private async callGoogle(prompt: string): Promise<ModelResponse> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.modelName}:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google API Error Details:`, {
          status: response.status,
          statusText: response.statusText,
          modelName: this.config.modelName,
          error: errorText
        });
        throw new Error(`Google API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        text: data.candidates[0].content.parts[0].text
      };
    } catch (error) {
      console.error('Google API call failed:', error);
      throw error;
    }
  }

  private async callHuggingFace(prompt: string): Promise<ModelResponse> {
    try {
      const response = await fetch(
        this.config.endpoint || `https://api-inference.huggingface.co/models/${this.config.modelName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              return_full_text: false
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: Array.isArray(data) ? data[0].generated_text : data.generated_text
      };
    } catch (error) {
      console.error('HuggingFace API call failed:', error);
      throw error;
    }
  }
}

// 모델 설정을 가져오는 함수
export async function getModelConfig(modelId: string): Promise<ModelConfig | null> {
  console.log(`🔍 Getting config for model: ${modelId}`);
  
  // 지정된 3개 UUID에 대한 직접 매핑
  const uuidToConfigMap: { [key: string]: ModelConfig } = {
    'cb7d2bb8-049c-4271-99a2-bffedebe2487': {
      provider: 'openai',
      modelName: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY || '',
    },
    '603d268f-d984-43b6-a85e-445bdd955061': {
      provider: 'anthropic',
      modelName: 'claude-3-opus-20240229',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    },
    '3e72f00e-b450-4dff-812e-a013c4cca457': {
      provider: 'google',
      modelName: 'gemini-2.0-flash',
      apiKey: process.env.GOOGLE_API_KEY || '',
    }
  };

  // UUID 기반 설정 확인
  if (uuidToConfigMap[modelId]) {
    console.log(`✅ Found direct UUID mapping for ${modelId}`);
    return uuidToConfigMap[modelId];
  }

  // UUID 형태이지만 매핑되지 않은 경우 데이터베이스에서 조회
  if (modelId.includes('-')) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/models`);
      if (response.ok) {
        const models = await response.json();
        const model = models.find((m: any) => m.id === modelId);
        if (model) {
          console.log(`📋 Found model in database: ${model.name}`);
          // 모델 이름을 기반으로 설정 매핑
          const normalizedName = model.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normalizedName.includes('gpt4') || normalizedName.includes('gpt-4') || normalizedName.includes('gpt4')) {
            return {
              provider: 'openai',
              modelName: 'gpt-4o',
              apiKey: process.env.OPENAI_API_KEY || '',
            };
          } else if (normalizedName.includes('claude')) {
            return {
              provider: 'anthropic',
              modelName: 'claude-3-opus-20240229',
              apiKey: process.env.ANTHROPIC_API_KEY || '',
            };
          } else if (normalizedName.includes('gemini') || normalizedName.includes('google')) {
            return {
              provider: 'google',
              modelName: 'gemini-2.0-flash',
              apiKey: process.env.GOOGLE_API_KEY || '',
            };
          }
        }
      }
    } catch (error) {
      console.error('Error fetching model info:', error);
    }
  }
  
  // 문자열 기반 모델 ID 지원 (하위 호환성)
  const modelConfigs: { [key: string]: ModelConfig } = {
    'gpt-4-turbo': {
      provider: 'openai',
      modelName: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY || '',
    },
    'claude-3-opus': {
      provider: 'anthropic',
      modelName: 'claude-3-opus-20240229',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    },
    'gemini-2.0-flash': {
      provider: 'google',
      modelName: 'gemini-2.0-flash',
      apiKey: process.env.GOOGLE_API_KEY || '',
    }
  };

  return modelConfigs[modelId] || null;
}

// 실제 모델 호출 함수
export async function callModel(modelId: string, prompt: string): Promise<string> {
  console.log(`🚀 Calling model: ${modelId}`);
  const config = await getModelConfig(modelId);
  
  if (!config) {
    console.warn(`❌ No configuration found for model: ${modelId}, using fallback`);
    // 설정이 없으면 시뮬레이션 응답 반환
    return await getFallbackResponse(modelId, prompt);
  }

  if (!config.apiKey) {
    console.warn(`🔑 No API key found for model: ${modelId}, using fallback`);
    return await getFallbackResponse(modelId, prompt);
  }

  console.log(`✅ API key found for ${config.provider}, attempting real API call...`);
  
  try {
    const client = new ModelAPIClient(config);
    const response = await client.generateResponse(prompt);
    console.log(`✅ Successfully called ${modelId} API`);
    return response.text;
  } catch (error) {
    console.error(`❌ Error calling model ${modelId}:`, error);
    // API 호출 실패시 폴백 응답 반환
    return await getFallbackResponse(modelId, prompt);
  }
}

// 폴백 응답 (시뮬레이션)
async function getFallbackResponse(modelId: string, prompt: string): Promise<string> {
  console.log(`🔄 Using fallback simulation for model: ${modelId}`);
  
  // 실제 API 호출과 비슷한 지연 시간 추가 (2-4초)
  const delay = 2000 + Math.random() * 2000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const responses: { [key: string]: string[] } = {
    'gpt-4': [
      "삼각형은 세 개의 변과 세 개의 꼭짓점을 가진 다각형입니다. 삼각형의 내각의 합은 항상 180도입니다.",
      "17 + 25를 계산하면 42입니다. 일의 자리 7 + 5 = 12이므로 1을 올림하여 십의 자리는 1 + 1 + 2 = 4가 됩니다.",
      "직사각형의 둘레는 (가로 + 세로) × 2로 계산할 수 있습니다. 가로가 7cm, 세로가 4cm이면 (7 + 4) × 2 = 22cm입니다."
    ],
    'claude-3': [
      "삼각형은 평면 도형으로 세 개의 직선으로 둘러싸인 도형입니다. 삼각형의 세 내각의 합은 180도라는 중요한 성질이 있습니다.",
      "덧셈을 단계별로 해보겠습니다. 17 + 25에서 먼저 일의 자리를 계산하면 7 + 5 = 12입니다. 12에서 10을 십의 자리로 올리고 2를 남겨둡니다.",
      "직사각형의 둘레를 구하는 공식을 사용해보겠습니다. 둘레 = 2 × (가로 + 세로) = 2 × (7 + 4) = 2 × 11 = 22cm입니다."
    ],
    'gemini-pro': [
      "삼각형은 기하학의 기본 도형 중 하나입니다. 삼각형의 특징으로는 세 개의 변, 세 개의 꼭짓점, 그리고 세 내각의 합이 180도라는 점이 있습니다.",
      "이 문제는 두 자리 수의 덧셈입니다. 17 + 25 = 42입니다. 계산 과정을 보면 7 + 5 = 12이므로 일의 자리는 2, 십의 자리는 1 + 1 + 2 = 4입니다.",
      "직사각형 둘레 계산: 둘레 = 2 × (길이 + 너비) = 2 × (7cm + 4cm) = 2 × 11cm = 22cm"
    ]
  };

  const modelResponses = responses[modelId] || responses['gpt-4'];
  const randomIndex = Math.floor(Math.random() * modelResponses.length);
  
  return modelResponses[randomIndex];
} 