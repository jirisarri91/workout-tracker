import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServerClient();
  const { data, error } = await db
    .from('workout_sessions')
    .select(`
      *,
      exercises:workout_session_exercises(
        *,
        exercise:exercises(*),
        replaced_exercise:exercises!workout_session_exercises_replaced_exercise_id_fkey(*)
      )
    `)
    .eq('id', id)
    .single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServerClient();
  const body = await req.json();
  const { data, error } = await db
    .from('workout_sessions')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServerClient();
  const { error } = await db.from('workout_sessions').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
