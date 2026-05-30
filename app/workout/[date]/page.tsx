'use client';
import { use, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { useExercises } from '@/hooks/useExercises';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { OrphanedSessionExerciseCard } from '@/components/workout/OrphanedSessionExerciseCard';
import { SessionSummary } from '@/components/workout/SessionSummary';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { WorkoutPlanExercise, WorkoutSessionExercise, ProgressSuggestion } from '@/types';

export default function WorkoutPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);

  const { plan, isLoading: loadingPlan, mutate: mutatePlan } = useWorkoutPlan(date);
  const { session, isLoading: loadingSession, mutate: mutateSession } = useWorkoutSession(date);
  const { exercises: allExercises, isLoading: loadingExercises } = useExercises();
  const [suggestions, setSuggestions] = useState<Record<string, ProgressSuggestion>>({});
  const [showSummary, setShowSummary] = useState(false);

  const loading = loadingPlan || loadingSession || loadingExercises;

  function refresh() {
    mutateSession();
    mutatePlan();
  }

  useEffect(() => {
    if (!plan?.exercises?.length) return;
    const ids = plan.exercises.map(e => e.exercise_id).join(',');
    fetch(`/api/progress/suggestions?exerciseIds=${ids}`)
      .then(r => r.json())
      .then(setSuggestions)
      .catch(() => {});
  }, [plan]);

  useEffect(() => {
    if (session?.status === 'done' && (session.exercises?.length ?? 0) > 0) {
      setShowSummary(true);
    }
  }, [session?.status, session?.exercises?.length]);

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
          {planExercises.length > 0 && (() => {
            const sorted = [...planExercises].sort((a, b) => a.order_index - b.order_index);
            const blockMap = new Map<string, WorkoutPlanExercise[]>();
            for (const ex of sorted) {
              const key = ex.block_name ?? '';
              if (!blockMap.has(key)) blockMap.set(key, []);
              blockMap.get(key)!.push(ex);
            }
            const blocks = Array.from(blockMap.entries());
            const hasNamedBlocks = blocks.some(([name]) => name !== '');
            return blocks.map(([blockName, exercises]) => (
              <div key={blockName || '__none__'} className="flex flex-col gap-3">
                {hasNamedBlocks && blockName && (
                  <h2 className="font-semibold text-slate-500 text-xs uppercase tracking-widest px-1 pt-1">
                    {blockName}
                  </h2>
                )}
                {exercises.map(planEx => (
                  <ExerciseCard
                    key={planEx.id}
                    planExercise={planEx}
                    sessionExercise={getSessionExercise(planEx.id)}
                    allExercises={allExercises}
                    sessionId={session?.id ?? ''}
                    onEnsureSession={ensureSession}
                    onUpdated={refresh}
                    suggestion={suggestions[planEx.exercise_id]}
                  />
                ))}
              </div>
            ));
          })()}
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

      {showSummary && session && (
        <SessionSummary session={session} onClose={() => setShowSummary(false)} />
      )}
    </div>
  );
}
