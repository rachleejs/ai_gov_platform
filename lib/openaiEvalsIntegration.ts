// OpenAI Evals 프레임워크 통합

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface OpenAIEval {
  id: string;
  name: string;
  description: string;
  category: string;
  evalPath: string; // evals 저장소 내 경로
}

// OpenAI Evals에서 가져올 수 있는 평가들
export const AVAILABLE_OPENAI_EVALS: OpenAIEval[] = [
  {
    id: 'math',
    name: 'Mathematics',
    description: '수학 문제 해결 능력 평가',
    category: 'reasoning',
    evalPath: 'evals/registry/evals/math.yaml'
  },
  {
    id: 'code',
    name: 'Code Generation',
    description: '코드 생성 및 프로그래밍 능력 평가',
    category: 'coding',
    evalPath: 'evals/registry/evals/humaneval.yaml'
  },
  {
    id: 'logic',
    name: 'Logical Reasoning',
    description: '논리적 추론 능력 평가',
    category: 'reasoning',
    evalPath: 'evals/registry/evals/logic.yaml'
  },
  {
    id: 'reading-comprehension',
    name: 'Reading Comprehension',
    description: '독해 능력 평가',
    category: 'language',
    evalPath: 'evals/registry/evals/reading-comprehension.yaml'
  }
];

export class OpenAIEvalsManager {
  private evalsPath: string;

  constructor() {
    this.evalsPath = path.join(process.cwd(), 'external_frameworks', 'openai_evals');
  }

  // OpenAI Evals 저장소 초기 설정
  async setupEvalsFramework(): Promise<void> {
    try {
      // 1. evals 저장소가 없으면 클론
      const evalsExists = await this.checkEvalsExists();
      if (!evalsExists) {
        console.log('🔄 Cloning OpenAI Evals repository...');
        await execAsync(`git clone https://github.com/openai/evals.git ${this.evalsPath}`);
        console.log('✅ OpenAI Evals cloned successfully');
      }

      // 2. 의존성 설치
      console.log('📦 Installing OpenAI Evals dependencies...');
      await execAsync(`cd ${this.evalsPath} && pip install -e .`);
      console.log('✅ Dependencies installed');

    } catch (error) {
      console.error('❌ Failed to setup OpenAI Evals:', error);
      throw error;
    }
  }

  // evals 저장소 존재 여부 확인
  private async checkEvalsExists(): Promise<boolean> {
    try {
      await fs.access(this.evalsPath);
      return true;
    } catch {
      return false;
    }
  }

  // 사용 가능한 평가 목록 반환
  getAvailableEvals(): OpenAIEval[] {
    return AVAILABLE_OPENAI_EVALS;
  }

  // 특정 평가 실행 (시뮬레이션)
  async runEvaluation(
    evalId: string, 
    modelName: string,
    options: {
      maxSamples?: number;
      seed?: number;
    } = {}
  ): Promise<OpenAIEvalResult> {
    
    const evalConfig = AVAILABLE_OPENAI_EVALS.find(e => e.id === evalId);
    if (!evalConfig) {
      throw new Error(`Evaluation ${evalId} not found`);
    }

    console.log(`🔄 Simulating OpenAI Eval: ${evalConfig.name} for ${modelName}`);
    
    // 시뮬레이션 지연 시간
    await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 2500));
    
    // 평가별 시뮬레이션 점수
    const simulatedScores: Record<string, number> = {
      'math': 70 + Math.random() * 25,
      'code': 65 + Math.random() * 30,
      'logic': 60 + Math.random() * 35,
      'reading-comprehension': 75 + Math.random() * 20
    };
    
    const score = Math.round(simulatedScores[evalId] || (50 + Math.random() * 45));
    
    return {
      evalId,
      evalName: evalConfig.name,
      modelName,
      score,
      details: { 
        simulation: true,
        message: `Simulated ${evalConfig.name} evaluation for ${modelName}`,
        framework: 'openai-evals',
        maxSamples: options.maxSamples || 10
      },
      timestamp: new Date()
    };
  }

  // OpenAI Evals 명령어 생성
  private buildEvalCommand(
    evalId: string, 
    modelName: string, 
    options: { maxSamples?: number; seed?: number }
  ): string {
    
    const baseCommand = `cd ${this.evalsPath} && python -m evals.cli.oaieval`;
    const params = [
      modelName, // 모델명
      evalId, // 평가 ID
      `--max_samples ${options.maxSamples || 10}`,
      `--seed ${options.seed || 42}`,
      '--record_path ./results' // 결과 저장 경로
    ];

    return `${baseCommand} ${params.join(' ')}`;
  }

  // 평가 결과 파싱
  private parseEvalResults(stdout: string): { score: number; details: any } {
    try {
      // OpenAI Evals 결과는 JSON 형태로 출력됨
      const lines = stdout.split('\n');
      const resultLine = lines.find(line => line.includes('Final report:'));
      
      if (resultLine) {
        const jsonMatch = resultLine.match(/\{.*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            score: result.accuracy || result.score || 0,
            details: result
          };
        }
      }
      
      // 파싱 실패시 기본값
      return { score: 0, details: { raw_output: stdout } };
      
    } catch (error) {
      console.error('Failed to parse eval results:', error);
      return { score: 0, details: { error: 'Parse failed' } };
    }
  }

  // 커스텀 평가 추가 (YAML 파일 생성)
  async addCustomEval(evalConfig: {
    id: string;
    name: string;
    description: string;
    samples: Array<{
      input: string;
      ideal: string;
    }>;
  }): Promise<void> {
    
    const yamlContent = this.generateEvalYAML(evalConfig);
    const evalPath = path.join(this.evalsPath, 'evals', 'registry', 'evals', `${evalConfig.id}.yaml`);
    
    await fs.writeFile(evalPath, yamlContent, 'utf-8');
    console.log(`✅ Custom eval ${evalConfig.id} added successfully`);
  }

  // YAML 평가 파일 생성
  private generateEvalYAML(config: any): string {
    return `
${config.id}:
  id: ${config.id}.v1
  description: ${config.description}
  metrics: [accuracy]
  
${config.id}.v1:
  class: evals.elsuite.basic.match:Match
  args:
    samples_jsonl: ${config.id}_samples.jsonl
`;
  }
}

export interface OpenAIEvalResult {
  evalId: string;
  evalName: string;
  modelName: string;
  score: number;
  details: any;
  timestamp: Date;
}

// 사용 예시
export async function runOpenAIEvaluation(
  evalId: string,
  modelId: string
): Promise<OpenAIEvalResult> {
  
  const evalsManager = new OpenAIEvalsManager();
  
  // 1. 프레임워크 설정 (최초 1회)
  await evalsManager.setupEvalsFramework();
  
  // 2. 평가 실행
  const result = await evalsManager.runEvaluation(evalId, modelId, {
    maxSamples: 5, // 테스트용으로 적은 샘플 수
    seed: 42
  });
  
  return result;
} 