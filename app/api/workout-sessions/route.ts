import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

const include = {
  exercises: {
    include: { exercise: true, replaced_exercise: true },
    orderBy: { order_index: 'asc' as const },
  },
} as const;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');

  if (date) {
    const data = await prisma.workoutSession.findUnique({ where: { date: new Date(date) }, include });
    return Response.json(serialize(data));
  }

  if (year && month) {
    const y = parseInt(year);
    const m = parseInt(month);
    const start = new Date(`${y}-${String(m).padStart(2, '0')}-01`);
    const end = new Date(`${y}-${String(m).padStart(2, '0')}-31`);
    const data = await prisma.workoutSession.findMany({
      where: { date: { gte: start, lte: end } },
      include,
      orderBy: { date: 'asc' },
    });
    return Response.json(serialize(data));
  }

  const data = await prisma.workoutSession.findMany({ include, orderBy: { date: 'asc' } });
  return Response.json(serialize(data));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await prisma.workoutSession.create({
    data: {
      workout_plan_id: body.workout_plan_id ?? null,
      date: new Date(body.date),
      status: body.status ?? 'planned',
      actual_start_time: body.actual_start_time ? new Date(body.actual_start_time) : null,
      actual_end_time: body.actual_end_time ? new Date(body.actual_end_time) : null,
      notes: body.notes ?? null,
    },
  });
  return Response.json(serialize(data), { status: 201 });
}
