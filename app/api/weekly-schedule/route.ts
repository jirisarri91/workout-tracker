import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

const include = {
  template: true,
} as const;

export async function GET() {
  const slots = await prisma.weeklyScheduleSlot.findMany({
    include,
    orderBy: { day_of_week: 'asc' },
  });
  return Response.json(serialize(slots));
}

// Expects: { slots: [{ day_of_week: 0-6, template_id: string | null }, ...] }
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const slots: { day_of_week: number; template_id: string | null }[] = body.slots;

  await prisma.$transaction(
    slots.map(slot =>
      prisma.weeklyScheduleSlot.upsert({
        where: { day_of_week: slot.day_of_week },
        create: {
          day_of_week: slot.day_of_week,
          template_id: slot.template_id,
        },
        update: {
          template_id: slot.template_id,
          updated_at: new Date(),
        },
      })
    )
  );

  const result = await prisma.weeklyScheduleSlot.findMany({
    include,
    orderBy: { day_of_week: 'asc' },
  });
  return Response.json(serialize(result));
}
