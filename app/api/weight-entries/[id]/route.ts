import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const entry = await prisma.weightEntry.update({
    where: { id },
    data: { weight_kg: body.weight_kg, notes: body.notes ?? null },
  });
  return Response.json(serialize(entry));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.weightEntry.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
