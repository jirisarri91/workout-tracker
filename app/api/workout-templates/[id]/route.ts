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
  const data = await prisma.workoutTemplate.findUnique({ where: { id }, include });
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(serialize(data));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { exercises, ...templateData } = body;

  await prisma.workoutTemplate.update({
    where: { id },
    data: {
      ...(templateData.name !== undefined && { name: templateData.name }),
      ...(templateData.objective !== undefined && { objective: templateData.objective }),
      ...(templateData.notes !== undefined && { notes: templateData.notes }),
      updated_at: new Date(),
    },
  });

  if (exercises !== undefined) {
    await prisma.workoutTemplateExercise.deleteMany({ where: { template_id: id } });
    if (exercises.length > 0) {
      await prisma.workoutTemplateExercise.createMany({
        data: exercises.map((e: Record<string, unknown>, i: number) => ({
          template_id: id,
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

  const result = await prisma.workoutTemplate.findUnique({ where: { id }, include });
  return Response.json(serialize(result));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.workoutTemplate.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
