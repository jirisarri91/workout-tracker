import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await prisma.exercise.findUnique({ where: { id } });
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(serialize(data));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data = await prisma.exercise.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.instructions !== undefined && { instructions: body.instructions }),
      ...(body.muscle_groups !== undefined && { muscle_groups: body.muscle_groups }),
      ...(body.resources !== undefined && { resources: body.resources }),
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
  const [planCount, sessionCount, templateCount] = await Promise.all([
    prisma.workoutPlanExercise.count({ where: { exercise_id: id } }),
    prisma.workoutSessionExercise.count({ where: { exercise_id: id } }),
    prisma.workoutTemplateExercise.count({ where: { exercise_id: id } }),
  ]);
  if (planCount + templateCount > 0) {
    return Response.json(
      { error: 'This exercise is used in active workout plans or templates and cannot be deleted.' },
      { status: 409 }
    );
  }
  if (sessionCount > 0) {
    const url = new URL(_req.url);
    if (url.searchParams.get('force') !== 'true') {
      return Response.json(
        { error: `This exercise appears in ${sessionCount} past workout session(s). Delete it and remove those records?`, code: 'HAS_SESSIONS', sessionCount },
        { status: 409 }
      );
    }
    await prisma.workoutSessionExercise.deleteMany({ where: { exercise_id: id } });
  }
  await prisma.exercise.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
