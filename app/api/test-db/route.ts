import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    // Test database connection by fetching AI models
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Database connection failed', 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Database connection successful',
      data 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 