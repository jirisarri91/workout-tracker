import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; exerciseId: string }> }
) {
  const { exerciseId } = await params;
  const db = createServerClient();
  const body = await req.json();
  const { data, error } = await db
    .from('workout_session_exercises')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', exerciseId)
    .select('*, exercise:exercises(*), replaced_exercise:exercises!workout_session_exercises_replaced_exercise_id_fkey(*)')
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; exerciseId: string }> }
) {
  const { exerciseId } = await params;
  const db = createServerClient();
  const { error } = await db
    .from('workout_session_exercises')
    .delete()
    .eq('id', exerciseId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
