import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

const include = {
  exercises: {
    include: { exercise: true },
    orderBy: { order_index: 'asc' as const },
  },
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await prisma.workoutPlan.findUnique({ where: { id }, include });
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(serialize(data));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { exercises, ...planData } = body;

  const plan = await prisma.workoutPlan.update({
    where: { id },
    data: {
      ...(planData.date !== undefined && { date: new Date(planData.date) }),
      ...(planData.name !== undefined && { name: planData.name }),
      ...(planData.objective !== undefined && { objective: planData.objective }),
      ...(planData.notes !== undefined && { notes: planData.notes }),
      ...(planData.start_time !== undefined && {
        start_time: planData.start_time ? new Date(`1970-01-01T${planData.start_time}Z`) : null,
      }),
      ...(planData.end_time !== undefined && {
        end_time: planData.end_time ? new Date(`1970-01-01T${planData.end_time}Z`) : null,
      }),
      updated_at: new Date(),
    },
  });

  if (exercises !== undefined) {
    await prisma.workoutPlanExercise.deleteMany({ where: { workout_plan_id: id } });
    if (exercises.length > 0) {
      await prisma.workoutPlanExercise.createMany({
        data: exercises.map((e: Record<string, unknown>, i: number) => ({
          workout_plan_id: id,
          exercise_id: e.exercise_id as string,
          block_name: e.block_name ?? null,
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
  }

  return Response.json(serialize(plan));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.workoutPlan.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
