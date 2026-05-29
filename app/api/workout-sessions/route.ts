import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const db = createServerClient();
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');

  let query = db.from('workout_sessions').select(`
    *,
    exercises:workout_session_exercises(
      *,
      exercise:exercises(*),
      replaced_exercise:exercises!workout_session_exercises_replaced_exercise_id_fkey(*)
    )
  `);

  if (date) {
    query = query.eq('date', date);
    const { data, error } = await query.maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data);
  }

  if (year && month) {
    const y = parseInt(year);
    const m = parseInt(month);
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const end = `${y}-${String(m).padStart(2, '0')}-31`;
    query = query.gte('date', start).lte('date', end);
  }

  const { data, error } = await query.order('date');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json();
  const { data, error } = await db
    .from('workout_sessions')
    .insert(body)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
