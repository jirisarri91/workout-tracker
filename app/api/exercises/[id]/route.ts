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
  await prisma.exercise.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
