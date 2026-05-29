import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const db = createServerClient();
  const body = await req.json();
  const { data, error } = await db
    .from('workout_session_exercises')
    .insert({ ...body, workout_session_id: sessionId })
    .select('*, exercise:exercises(*), replaced_exercise:exercises!workout_session_exercises_replaced_exercise_id_fkey(*)')
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
