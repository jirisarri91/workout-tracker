import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServerClient();
  const { data, error } = await db
    .from('workout_plans')
    .select('*, exercises:workout_plan_exercises(*, exercise:exercises(*))')
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
  const { exercises, ...planData } = body;

  const { data: plan, error } = await db
    .from('workout_plans')
    .update({ ...planData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (exercises !== undefined) {
    await db.from('workout_plan_exercises').delete().eq('workout_plan_id', id);
    if (exercises.length > 0) {
      const exRows = exercises.map((e: Record<string, unknown>, i: number) => ({
        workout_plan_id: id,
        exercise_id: e.exercise_id,
        order_index: i,
        sets: e.sets ?? null,
        reps: e.reps ?? null,
        duration_seconds: e.duration_seconds ?? null,
        target_weight: e.target_weight ?? null,
        rest_seconds: e.rest_seconds ?? null,
        notes: e.notes ?? null,
      }));
      await db.from('workout_plan_exercises').insert(exRows);
    }
  }

  return Response.json(plan);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServerClient();
  const { error } = await db.from('workout_plans').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
