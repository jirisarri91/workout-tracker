import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { source_plan_id, dates }: { source_plan_id: string; dates: string[] } = body;

  if (!source_plan_id || !dates?.length) {
    return Response.json({ error: 'source_plan_id and dates are required' }, { status: 400 });
  }

  const source = await prisma.workoutPlan.findUnique({
    where: { id: source_plan_id },
    include: {
      exercises: { orderBy: { order_index: 'asc' } },
    },
  });

  if (!source) {
    return Response.json({ error: 'Source plan not found' }, { status: 404 });
  }

  const results: { date: string; status: 'created' | 'skipped' }[] = [];

  for (const dateStr of dates) {
    const date = new Date(dateStr);
    const existing = await prisma.workoutPlan.findUnique({ where: { date } });

    if (existing) {
      results.push({ date: dateStr, status: 'skipped' });
      continue;
    }

    const newPlan = await prisma.workoutPlan.create({
      data: {
        date,
        name: source.name,
        objective: source.objective,
        notes: source.notes,
        start_time: source.start_time,
        end_time: source.end_time,
      },
    });

    if (source.exercises.length > 0) {
      await prisma.workoutPlanExercise.createMany({
        data: source.exercises.map((e) => ({
          workout_plan_id: newPlan.id,
          exercise_id: e.exercise_id,
          block_name: e.block_name,
          order_index: e.order_index,
          sets: e.sets,
          reps: e.reps,
          duration_seconds: e.duration_seconds,
          target_weight: e.target_weight,
          rest_seconds: e.rest_seconds,
          notes: e.notes,
        })),
      });
    }

    results.push({ date: dateStr, status: 'created' });
  }

  return Response.json(serialize(results), { status: 201 });
}
