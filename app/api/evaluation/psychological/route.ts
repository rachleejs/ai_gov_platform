import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get('modelId');

  if (!modelId) {
    return NextResponse.json({ error: 'modelId is required' }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('psychological_evaluations')
    .select('*')
    .eq('model_id', modelId)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching psychological evaluation:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluation' }, { status: 500 });
  }

  return NextResponse.json(data[0] || null);
}


export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { modelId, scores, totalScore, percentage, grade } = await request.json();

  if (!modelId || !scores || totalScore === undefined || percentage === undefined || !grade) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('psychological_evaluations')
    .insert([
      {
        model_id: modelId,
        user_id: session.user.id,
        scores,
        total_score: totalScore,
        percentage,
        grade,
      },
    ])
    .select();

  if (error) {
    console.error('Error saving psychological evaluation:', error);
    return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 });
  }

  return NextResponse.json(data[0]);
} 