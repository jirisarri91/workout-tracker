import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mesocycle = await prisma.mesocycle.findUnique({ where: { id } });
  if (!mesocycle) return new Response('Not found', { status: 404 });
  return Response.json(serialize(mesocycle));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const mesocycle = await prisma.mesocycle.update({
    where: { id },
    data: {
      name: body.name,
      start_date: body.start_date ? new Date(body.start_date) : undefined,
      end_date: body.end_date ? new Date(body.end_date) : undefined,
      goal: body.goal ?? null,
      notes: body.notes ?? null,
      updated_at: new Date(),
    },
  });
  return Response.json(serialize(mesocycle));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.mesocycle.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
