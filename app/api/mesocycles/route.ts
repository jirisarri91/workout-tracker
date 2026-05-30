import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

export async function GET() {
  const mesocycles = await prisma.mesocycle.findMany({ orderBy: { start_date: 'desc' } });
  return Response.json(serialize(mesocycles));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const mesocycle = await prisma.mesocycle.create({
    data: {
      name: body.name,
      start_date: new Date(body.start_date),
      end_date: new Date(body.end_date),
      goal: body.goal ?? null,
      notes: body.notes ?? null,
    },
  });
  return Response.json(serialize(mesocycle), { status: 201 });
}
