'use client';
import { use } from 'react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { useExercises } from '@/hooks/useExercises';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { OrphanedSessionExerciseCard } from '@/components/workout/OrphanedSessionExerciseCard';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { WorkoutPlanExercise, WorkoutSessionExercise } from '@/types';

export default function WorkoutPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);

  const { plan, isLoading: loadingPlan, mutate: mutatePlan } = useWorkoutPlan(date);
  const { session, isLoading: loadingSession, mutate: mutateSession } = useWorkoutSession(date);
  const { exercises: allExercises, isLoading: loadingExercises } = useExercises();

  const loading = loadingPlan || loadingSession || loadingExercises;

  function refresh() {
    mutateSession();
    mutatePlan();
  }

  if (loading) return <PageSpinner />;

  const planExercises: WorkoutPlanExercise[] = plan?.exercises ?? [];
  const sessionExercises: WorkoutSessionExercise[] = session?.exercises ?? [];

  function getSessionExercise(planExId: string): WorkoutSessionExercise | null {
    return sessionExercises.find(se => se.workout_plan_exercise_id === planExId) ?? null;
  }

  const planExerciseIds = new Set(planExercises.map(pe => pe.id));
  const orphanedSessionExercises = sessionExercises.filter(
    se => !se.workout_plan_exercise_id || !planExerciseIds.has(se.workout_plan_exercise_id)
  );

  async function ensureSession(): Promise<string> {
    if (session?.id) return session.id;
    const resp = await fetch('/api/workout-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, status: 'done' }),
    });
    const created = await resp.json();
    await mutateSession();
    return created.id;
  }

  const displayDate = format(parseISO(date), 'EEEE, MMM d');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">{displayDate}</h1>
        <Link href="/planner">
          <Button size="sm" variant="outline">Edit plan</Button>
        </Link>
      </div>

      <WorkoutHeader
        date={date}
        session={session}
        planName={plan?.name}
        planObjective={plan?.objective}
        onSessionUpdated={refresh}
      />

      {planExercises.length === 0 && orphanedSessionExercises.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-slate-400 mb-3">No workout planned for this day</p>
          <Link href="/planner">
            <Button variant="outline">Plan a workout</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {planExercises.length > 0 && (
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              Exercises ({planExercises.length})
            </h2>
          )}
          {planExercises
            .sort((a, b) => a.order_index - b.order_index)
            .map(planEx => (
              <ExerciseCard
                key={planEx.id}
                planExercise={planEx}
                sessionExercise={getSessionExercise(planEx.id)}
                allExercises={allExercises}
                sessionId={session?.id ?? ''}
                onEnsureSession={ensureSession}
                onUpdated={refresh}
              />
            ))
          }
          {orphanedSessionExercises.length > 0 && (
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mt-2">
              Past exercises
            </h2>
          )}
          {orphanedSessionExercises.map(se => (
            <OrphanedSessionExerciseCard
              key={se.id}
              sessionExercise={se}
              onUpdated={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
