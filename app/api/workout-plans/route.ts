import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const db = createServerClient();
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');

  let query = db.from('workout_plans').select(`
    *,
    exercises:workout_plan_exercises(
      *,
      exercise:exercises(*)
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
  const { exercises, ...planData } = body;

  const { data: plan, error } = await db
    .from('workout_plans')
    .insert(planData)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (exercises?.length > 0) {
    const exRows = exercises.map((e: Record<string, unknown>, i: number) => ({
      workout_plan_id: plan.id,
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

  return Response.json(plan, { status: 201 });
}
