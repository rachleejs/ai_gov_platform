import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Check if external framework scripts exist
    const scriptsDir = path.join(process.cwd(), 'external_frameworks');
    const isInstalled = fs.existsSync(scriptsDir);
    
    console.log(`Checking external frameworks status: ${isInstalled ? 'installed' : 'not installed'}`);
    
    return NextResponse.json({
      isInstalled,
      status: isInstalled ? '설치되었습니다. 사용 가능합니다.' : '설치되지 않았습니다.',
    });
  } catch (error) {
    console.error('Error checking external frameworks status:', error);
    return NextResponse.json({
      isInstalled: false,
      status: '상태 확인 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
