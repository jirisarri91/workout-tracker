import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

export async function GET() {
  const data = await prisma.exercise.findMany({ orderBy: { name: 'asc' } });
  return Response.json(serialize(data));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await prisma.exercise.create({
    data: {
      name: body.name,
      instructions: body.instructions ?? null,
      muscle_groups: body.muscle_groups ?? [],
      resources: body.resources ?? [],
    },
  });
  return Response.json(serialize(data), { status: 201 });
}
