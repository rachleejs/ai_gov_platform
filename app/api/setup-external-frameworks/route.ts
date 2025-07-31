// 외부 프레임워크 설치 API

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface SetupResponse {
  success: boolean;
  message?: string;
  error?: string;
  logs?: string[];
}

// POST: 외부 프레임워크 설치 실행
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/setup-external-frameworks - 외부 프레임워크 설치 시작");
    
    // 스크립트 경로
    const scriptPath = path.join(process.cwd(), 'scripts', 'setup-external-evaluators.sh');
    
    // 스크립트 실행
    console.log(`🚀 Executing setup script: ${scriptPath}`);
    
    const { stdout, stderr } = await execAsync(`chmod +x ${scriptPath} && ${scriptPath}`, {
      cwd: process.cwd(),
      timeout: 300000, // 5분 타임아웃
      maxBuffer: 1024 * 1024 * 10 // 10MB 버퍼
    });
    
    console.log('✅ Setup script execution completed');
    console.log('STDOUT:', stdout);
    if (stderr) {
      console.log('STDERR:', stderr);
    }
    
    // 로그를 줄 단위로 분할
    const logs = stdout.split('\n').filter(line => line.trim().length > 0);
    
    return NextResponse.json({
      success: true,
      message: '외부 프레임워크 설치가 완료되었습니다.',
      logs
    } as SetupResponse);
    
  } catch (error: any) {
    console.error('Error during setup:', error);
    
    // 타임아웃 오류인 경우
    if (error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { 
          success: false, 
          error: '설치 시간이 초과되었습니다. 터미널에서 직접 실행해보세요.' 
        } as SetupResponse,
        { status: 408 }
      );
    }
    
    // 기타 오류
    return NextResponse.json(
      { 
        success: false, 
        error: `설치 중 오류가 발생했습니다: ${error.message}`,
        logs: error.stdout ? error.stdout.split('\n') : []
      } as SetupResponse,
      { status: 500 }
    );
  }
}

// GET: 설치 상태 확인
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/setup-external-frameworks - 설치 상태 확인");
    
    const frameworkPaths = [
      'external_frameworks/openai_evals',
      'external_frameworks/lm_eval_harness', 
      'external_frameworks/big_bench',
      'external_frameworks/helm'
    ];
    
    const installStatus: Record<string, boolean> = {};
    
    for (const frameworkPath of frameworkPaths) {
      try {
        const { stdout } = await execAsync(`ls ${frameworkPath}`, { cwd: process.cwd() });
        installStatus[frameworkPath] = stdout.length > 0;
      } catch {
        installStatus[frameworkPath] = false;
      }
    }
    
    const allInstalled = Object.values(installStatus).every(status => status);
    
    return NextResponse.json({
      success: true,
      allInstalled,
      installStatus,
      message: allInstalled ? '모든 프레임워크가 설치되어 있습니다.' : '일부 프레임워크가 설치되지 않았습니다.'
    } as SetupResponse & { allInstalled: boolean; installStatus: Record<string, boolean> });
    
  } catch (error: any) {
    console.error('Error checking setup status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `상태 확인 중 오류가 발생했습니다: ${error.message}` 
      } as SetupResponse,
      { status: 500 }
    );
  }
} 