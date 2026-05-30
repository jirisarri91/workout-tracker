import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

const include = {
  exercises: {
    include: { exercise: true, replaced_exercise: true },
    orderBy: { order_index: 'asc' as const },
  },
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await prisma.workoutSession.findUnique({ where: { id }, include });
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(serialize(data));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data = await prisma.workoutSession.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.actual_start_time !== undefined && {
        actual_start_time: body.actual_start_time ? new Date(body.actual_start_time) : null,
      }),
      ...(body.actual_end_time !== undefined && {
        actual_end_time: body.actual_end_time ? new Date(body.actual_end_time) : null,
      }),
      ...(body.workout_plan_id !== undefined && { workout_plan_id: body.workout_plan_id }),
      updated_at: new Date(),
    },
  });
  return Response.json(serialize(data));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.workoutSession.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
