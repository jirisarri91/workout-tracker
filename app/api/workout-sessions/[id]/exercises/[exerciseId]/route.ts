import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; exerciseId: string }> }
) {
  const { exerciseId } = await params;
  const body = await req.json();
  const data = await prisma.workoutSessionExercise.update({
    where: { id: exerciseId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.exercise_id !== undefined && { exercise_id: body.exercise_id }),
      ...(body.replaced_exercise_id !== undefined && { replaced_exercise_id: body.replaced_exercise_id }),
      ...(body.order_index !== undefined && { order_index: body.order_index }),
      ...(body.sets !== undefined && { sets: body.sets }),
      ...(body.reps !== undefined && { reps: body.reps }),
      ...(body.actual_weight !== undefined && { actual_weight: body.actual_weight }),
      ...(body.duration_seconds !== undefined && { duration_seconds: body.duration_seconds }),
      ...(body.observations !== undefined && { observations: body.observations }),
      updated_at: new Date(),
    } as any,
    include: { exercise: true, replaced_exercise: true },
  });
  return Response.json(serialize(data));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; exerciseId: string }> }
) {
  const { exerciseId } = await params;
  await prisma.workoutSessionExercise.delete({ where: { id: exerciseId } });
  return new Response(null, { status: 204 });
}
