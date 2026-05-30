import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  const where =
    year && month
      ? {
          date: {
            gte: new Date(`${year}-${String(month).padStart(2, '0')}-01`),
            lt: new Date(Number(month) === 12 ? `${Number(year) + 1}-01-01` : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`),
          },
        }
      : {};

  const entries = await prisma.weightEntry.findMany({ where, orderBy: { date: 'desc' } });
  return Response.json(serialize(entries));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry = await prisma.weightEntry.upsert({
    where: { date: new Date(body.date) },
    update: { weight_kg: body.weight_kg, notes: body.notes ?? null },
    create: { date: new Date(body.date), weight_kg: body.weight_kg, notes: body.notes ?? null },
  });
  return Response.json(serialize(entry), { status: 201 });
}
