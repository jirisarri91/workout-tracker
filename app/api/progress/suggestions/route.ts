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
      const [lastWithWeight, lastWithDuration] = await Promise.all([
        prisma.workoutSessionExercise.findFirst({
          where: { exercise_id: exerciseId, status: { not: 'not_done' }, actual_weight: { not: null } },
          include: { workout_session: { select: { date: true } } },
          orderBy: { workout_session: { date: 'desc' } },
        }),
        prisma.workoutSessionExercise.findFirst({
          where: { exercise_id: exerciseId, status: { not: 'not_done' }, duration_seconds: { not: null } },
          include: { workout_session: { select: { date: true } } },
          orderBy: { workout_session: { date: 'desc' } },
        }),
      ]);

      if (!lastWithWeight || !lastWithWeight.actual_weight) {
        return {
          exerciseId,
          lastWeight: null,
          suggestedWeight: null,
          lastDate: null,
          lastDuration: lastWithDuration?.duration_seconds ? Number(lastWithDuration.duration_seconds) : null,
        };
      }

      const lastWeight = Number(lastWithWeight.actual_weight);
      const suggestedWeight = Math.round(lastWeight * 1.05 * 2) / 2;

      return {
        exerciseId,
        lastWeight,
        suggestedWeight,
        lastDate: lastWithWeight.workout_session.date.toISOString().split('T')[0],
        lastDuration: lastWithDuration?.duration_seconds ? Number(lastWithDuration.duration_seconds) : null,
      };
    })
  );

  const map: Record<string, ProgressSuggestion> = {};
  for (const r of results) map[r.exerciseId] = r;
  return Response.json(map);
}
