import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import util from 'util';
import child_process from 'child_process';

const exec = util.promisify(child_process.exec);

export async function POST() {
  try {
    // Create external_frameworks directory if it doesn't exist
    const scriptsDir = path.join(process.cwd(), 'external_frameworks');
    
    if (!fs.existsSync(scriptsDir)) {
      console.log('Creating external_frameworks directory');
      fs.mkdirSync(scriptsDir, { recursive: true });
    }
    
    // Create results directory
    const resultsDir = path.join(scriptsDir, 'results');
    if (!fs.existsSync(resultsDir)) {
      console.log('Creating results directory');
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Make Python scripts executable
    const scriptFiles = [
      'run_hf_evaluate.py',
      'run_openai_evals.py',
      'run_lm_harness.py',
      'run_big_bench.py'
    ];
    
    for (const scriptFile of scriptFiles) {
      const scriptPath = path.join(scriptsDir, scriptFile);
      
      if (fs.existsSync(scriptPath)) {
        try {
          // Make script executable (Unix systems only)
          if (process.platform !== 'win32') {
            await exec(`chmod +x ${scriptPath}`);
            console.log(`Made ${scriptFile} executable`);
          }
        } catch (err) {
          console.error(`Failed to make ${scriptFile} executable:`, err);
        }
      }
    }
    
    // Create a file to indicate successful installation
    const sampleScriptPath = path.join(scriptsDir, 'installed.txt');
    fs.writeFileSync(sampleScriptPath, 'External frameworks installed at ' + new Date().toISOString());
    
    // Try to install Python dependencies
    try {
      console.log('Installing required Python packages...');
      await exec('pip install --user evaluate datasets transformers openai lm-eval numpy pandas');
      console.log('Python packages installed successfully');
    } catch (pipError) {
      console.warn('Failed to install Python packages:', pipError);
      // Continue despite pip error - we'll handle missing dependencies in the scripts
    }
    
    console.log('External frameworks setup completed successfully');
    
    return NextResponse.json({
      success: true,
      message: '외부 프레임워크가 성공적으로 설정되었습니다.'
    });
  } catch (error) {
    console.error('Error setting up external frameworks:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to setup external frameworks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}