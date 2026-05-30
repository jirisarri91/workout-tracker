import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

const include = {
  exercises: {
    include: { exercise: true },
    orderBy: { order_index: 'asc' as const },
  },
} as const;

export async function GET() {
  const data = await prisma.workoutTemplate.findMany({
    include,
    orderBy: { created_at: 'asc' },
  });
  return Response.json(serialize(data));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { exercises, ...templateData } = body;

  const template = await prisma.workoutTemplate.create({
    data: {
      name: templateData.name,
      objective: templateData.objective ?? null,
      notes: templateData.notes ?? null,
    },
  });

  if (exercises?.length > 0) {
    await prisma.workoutTemplateExercise.createMany({
      data: exercises.map((e: Record<string, unknown>, i: number) => ({
        template_id: template.id,
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

  const result = await prisma.workoutTemplate.findUnique({ where: { id: template.id }, include });
  return Response.json(serialize(result), { status: 201 });
}
