import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExerciseProgressPoint } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get('exerciseId');
  if (!exerciseId) return Response.json([], { status: 200 });

  const sessionExercises = await prisma.workoutSessionExercise.findMany({
    where: { exercise_id: exerciseId, status: { not: 'not_done' } },
    include: { workout_session: { select: { date: true } } },
    orderBy: { workout_session: { date: 'asc' } },
  });

  let maxWeightSeen = -Infinity;
  const points: ExerciseProgressPoint[] = sessionExercises.map(se => {
    const weight = se.actual_weight ? Number(se.actual_weight) : null;
    const sets = se.sets ?? null;
    const reps = se.reps ?? null;
    const volume = weight && sets && reps ? weight * sets * reps : null;
    const isPR = weight !== null && weight > maxWeightSeen;
    if (isPR) maxWeightSeen = weight;
    return {
      date: se.workout_session.date.toISOString().split('T')[0],
      weight,
      reps,
      sets,
      volume,
      isPR,
    };
  });

  return Response.json(points);
}
