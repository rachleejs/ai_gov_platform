import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Python 스크립트 실행 함수
async function runPythonScript(scriptPath: string, args: string[]): Promise<{stdout: string, stderr: string}> {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    const command = `${pythonPath} ${scriptPath} ${args.join(' ')}`;
    
    console.log(`Executing: ${command}`);
    
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Execution error: ${error}`);
        reject(error);
        return;
      }
      
      resolve({ stdout, stderr });
    });
  });
}

export async function POST(req: Request) {
  try {
    const { framework, evaluationId, modelId, options } = await req.json();
    
    // 각 프레임워크별 실행 스크립트 경로 결정
    let scriptPath: string;
    let args: string[] = [];
    
    const basePath = path.join(process.cwd(), 'external_frameworks');
    const resultsDir = path.join(basePath, 'results');
    
    // results 디렉토리가 없으면 생성
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // 고유한 결과 파일 경로 생성
    const resultId = uuidv4();
    const resultPath = path.join(resultsDir, `${resultId}.json`);
    
    // 프레임워크별 스크립트 설정
    switch (framework) {
      case 'huggingface-evaluate':
        scriptPath = path.join(basePath, 'run_hf_evaluate.py');
        args = [
          '--evaluation', evaluationId,
          '--model', modelId,
          '--output', resultPath
        ];
        break;
        
      case 'openai-evals':
        scriptPath = path.join(basePath, 'run_openai_evals.py');
        args = [
          '--evaluation', evaluationId,
          '--model', modelId,
          '--output', resultPath
        ];
        break;
        
      case 'lm-eval-harness':
        scriptPath = path.join(basePath, 'run_lm_harness.py');
        args = [
          '--task', evaluationId,
          '--model', modelId,
          '--output', resultPath
        ];
        break;
        
      case 'big-bench':
        scriptPath = path.join(basePath, 'run_big_bench.py');
        args = [
          '--task', evaluationId,
          '--model', modelId,
          '--output', resultPath
        ];
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: `지원하지 않는 프레임워크: ${framework}`
        }, { status: 400 });
    }

    console.log(`Running real evaluation: ${framework} - ${evaluationId} on model ${modelId}`);
    
    try {
      // 스크립트 파일이 존재하는지 확인
      if (fs.existsSync(scriptPath)) {
        // 실제 Python 스크립트 실행
        const { stdout, stderr } = await runPythonScript(scriptPath, args);
        console.log('Script execution completed');
        
        // 결과 파일 확인
        if (fs.existsSync(resultPath)) {
          const resultContent = fs.readFileSync(resultPath, 'utf8');
          const result = JSON.parse(resultContent);
          
          // 결과 응답
          return NextResponse.json({
            success: true,
            data: {
              ...result,
              details: {
                ...result.details,
                actualEvaluation: true,
                stdout: stdout.substring(0, 1000), // 출력의 일부만 포함
                stderr: stderr.substring(0, 1000)  // 에러의 일부만 포함
              },
              framework,
              evaluationId,
              modelId,
              timestamp: new Date()
            }
          });
        } else {
          console.error(`Result file not found: ${resultPath}`);
        }
      } else {
        console.error(`Script file not found: ${scriptPath}`);
      }
      
      // 스크립트 실행 실패 시 오류 반환
      return NextResponse.json({
        success: false,
        error: '평가 스크립트 실행에 실패했습니다.',
        details: `스크립트가 존재하지 않거나 실행 중 오류가 발생했습니다: ${scriptPath}`
      }, { status: 500 });
    } catch (execError) {
      console.error('Script execution error:', execError);
      return NextResponse.json({
        success: false,
        error: '스크립트 실행 오류',
        details: execError instanceof Error ? execError.message : '알 수 없는 오류'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'API 오류',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
