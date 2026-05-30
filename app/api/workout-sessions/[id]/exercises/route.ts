import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await req.json();
  const data = await prisma.workoutSessionExercise.create({
    data: {
      workout_session_id: sessionId,
      exercise_id: body.exercise_id,
      workout_plan_exercise_id: body.workout_plan_exercise_id ?? null,
      order_index: body.order_index ?? 0,
      status: body.status ?? 'done',
      replaced_exercise_id: body.replaced_exercise_id ?? null,
      sets: body.sets ?? null,
      reps: body.reps ?? null,
      actual_weight: body.actual_weight ?? null,
      duration_seconds: body.duration_seconds ?? null,
      observations: body.observations ?? null,
    },
    include: { exercise: true, replaced_exercise: true },
  });
  let isPR = false;
  if (body.actual_weight) {
    const best = await prisma.workoutSessionExercise.findFirst({
      where: {
        exercise_id: data.exercise_id,
        actual_weight: { not: null },
        id: { not: data.id },
      },
      orderBy: { actual_weight: 'desc' },
    });
    isPR = !best || Number(data.actual_weight) > Number(best.actual_weight);
  }

  return Response.json({ ...serialize(data) as object, isPR }, { status: 201 });
}
