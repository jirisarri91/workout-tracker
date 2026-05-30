import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

export async function GET() {
  const data = await prisma.userObjective.findFirst();
  return Response.json(serialize(data));
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const existing = await prisma.userObjective.findFirst({ select: { id: true } });

  const birthday = body.birthday ? new Date(body.birthday) : null;

  const data = existing
    ? await prisma.userObjective.update({
        where: { id: existing.id },
        data: {
          objective_text: body.objective_text ?? null,
          strategy_text: body.strategy_text ?? null,
          birthday: birthday !== undefined ? birthday : undefined,
          updated_at: new Date(),
        },
      })
    : await prisma.userObjective.create({
        data: {
          objective_text: body.objective_text ?? null,
          strategy_text: body.strategy_text ?? null,
          birthday,
        },
      });

  return Response.json(serialize(data));
}
