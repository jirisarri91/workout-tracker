import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

const include = {
  exercises: {
    include: { exercise: true },
    orderBy: { order_index: 'asc' as const },
  },
} as const;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');

  if (date) {
    const data = await prisma.workoutPlan.findUnique({ where: { date: new Date(date) }, include });
    return Response.json(serialize(data));
  }

  if (year && month) {
    const y = parseInt(year);
    const m = parseInt(month);
    const start = new Date(`${y}-${String(m).padStart(2, '0')}-01`);
    const end = new Date(`${y}-${String(m).padStart(2, '0')}-31`);
    const data = await prisma.workoutPlan.findMany({
      where: { date: { gte: start, lte: end } },
      include,
      orderBy: { date: 'asc' },
    });
    return Response.json(serialize(data));
  }

  const data = await prisma.workoutPlan.findMany({ include, orderBy: { date: 'asc' } });
  return Response.json(serialize(data));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { exercises, ...planData } = body;

  const plan = await prisma.workoutPlan.create({
    data: {
      date: new Date(planData.date),
      name: planData.name ?? null,
      objective: planData.objective ?? null,
      notes: planData.notes ?? null,
      start_time: planData.start_time ? new Date(`1970-01-01T${planData.start_time}Z`) : null,
      end_time: planData.end_time ? new Date(`1970-01-01T${planData.end_time}Z`) : null,
    },
  });

  if (exercises?.length > 0) {
    await prisma.workoutPlanExercise.createMany({
      data: exercises.map((e: Record<string, unknown>, i: number) => ({
        workout_plan_id: plan.id,
        exercise_id: e.exercise_id as string,
        order_index: i,
        sets: e.sets ?? null,
        reps: e.reps ?? null,
        duration_seconds: e.duration_seconds ?? null,
        target_weight: e.target_weight ?? null,
        rest_seconds: e.rest_seconds ?? null,
        notes: e.notes ?? null,
      })),
    });
  }

  return Response.json(serialize(plan), { status: 201 });
}
