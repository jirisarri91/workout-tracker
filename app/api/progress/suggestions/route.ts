import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProgressSuggestion } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get('exerciseIds');
  if (!ids) return Response.json({});

  const exerciseIds = ids.split(',').filter(Boolean);

  const results = await Promise.all(
    exerciseIds.map(async (exerciseId): Promise<ProgressSuggestion> => {
      const last = await prisma.workoutSessionExercise.findFirst({
        where: { exercise_id: exerciseId, status: { not: 'not_done' }, actual_weight: { not: null } },
        include: { workout_session: { select: { date: true } } },
        orderBy: { workout_session: { date: 'desc' } },
      });

      if (!last || !last.actual_weight) {
        return { exerciseId, lastWeight: null, suggestedWeight: null, lastDate: null };
      }

      const lastWeight = Number(last.actual_weight);
      const suggestedWeight = Math.round(lastWeight * 1.05 * 2) / 2;

      return {
        exerciseId,
        lastWeight,
        suggestedWeight,
        lastDate: last.workout_session.date.toISOString().split('T')[0],
      };
    })
  );

  const map: Record<string, ProgressSuggestion> = {};
  for (const r of results) map[r.exerciseId] = r;
  return Response.json(map);
}
