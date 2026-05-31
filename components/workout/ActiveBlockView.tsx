'use client';
import { Exercise, WorkoutPlanExercise, WorkoutSessionExercise, ProgressSuggestion } from '@/types';
import { CircuitExerciseCard } from './CircuitExerciseCard';

interface Props {
  blockName: string;
  exercises: WorkoutPlanExercise[];
  sessionExercises: WorkoutSessionExercise[];
  allExercises: Exercise[];
  sessionId: string;
  onEnsureSession: () => Promise<string>;
  onUpdated: () => void;
  suggestions: Record<string, ProgressSuggestion>;
  setsDone: Record<string, number>;
  onSetComplete: (planExerciseId: string) => void;
  onNext: () => void;
  isLastBlock: boolean;
}

export function ActiveBlockView({
  blockName,
  exercises,
  sessionExercises,
  allExercises,
  sessionId,
  onEnsureSession,
  onUpdated,
  suggestions,
  setsDone,
  onSetComplete,
  onNext,
  isLastBlock,
}: Props) {
  function getSessionExercise(planExId: string): WorkoutSessionExercise | null {
    return sessionExercises.find(se => se.workout_plan_exercise_id === planExId) ?? null;
  }

  const isCircuit = exercises.length > 1;

  // Derive round info for circuit blocks
  const setsPerEx = exercises.map(ex => ({
    id: ex.id,
    done: Math.min(setsDone[ex.id] ?? 0, ex.sets ?? 1),
    total: ex.sets ?? 1,
    skipped: getSessionExercise(ex.id)?.status === 'not_done',
  }));

  const activeExercises = setsPerEx.filter(e => !e.skipped);
  const minSetsDone = activeExercises.length > 0
    ? Math.min(...activeExercises.map(e => e.done))
    : 0;
  const maxSets = exercises.length > 0
    ? Math.max(...exercises.map(ex => ex.sets ?? 1))
    : 1;

  const currentRound = Math.min(minSetsDone + 1, maxSets);

  const blockDone = exercises.every(ex => {
    const se = getSessionExercise(ex.id);
    if (se?.status === 'not_done') return true; // skipped counts as "resolved"
    return (setsDone[ex.id] ?? 0) >= (ex.sets ?? 1);
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Block header */}
      <div className="flex items-center justify-between">
        <div>
          {blockName && (
            <h2 className="font-bold text-slate-900 text-base">{blockName}</h2>
          )}
          {isCircuit && !blockDone && (
            <p className="text-sm text-slate-500 mt-0.5">
              Round {currentRound} of {maxSets}
              <span className="ml-2 text-slate-400">· do each exercise, then repeat</span>
            </p>
          )}
        </div>
        {blockDone && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
            Block done ✓
          </span>
        )}
      </div>

      {/* Exercise cards */}
      <div className="flex flex-col gap-2">
        {exercises.map(planEx => {
          const done = Math.min(setsDone[planEx.id] ?? 0, planEx.sets ?? 1);
          const total = planEx.sets ?? 1;
          const se = getSessionExercise(planEx.id);

          // Highlight the current exercise in circuit mode:
          // first exercise that hasn't completed the current round
          const isDoneThisRound = done > minSetsDone || done >= total || se?.status === 'not_done';
          const isCurrentFocus = isCircuit && !blockDone && !isDoneThisRound;

          return (
            <div key={planEx.id} className={isCurrentFocus ? 'ring-2 ring-orange-400 ring-offset-2 rounded-2xl' : ''}>
              <CircuitExerciseCard
                planExercise={planEx}
                sessionExercise={se}
                allExercises={allExercises}
                sessionId={sessionId}
                onEnsureSession={onEnsureSession}
                onUpdated={onUpdated}
                suggestion={suggestions[planEx.exercise_id]}
                setsDone={done}
                totalSets={total}
                onSetComplete={() => onSetComplete(planEx.id)}
              />
            </div>
          );
        })}
      </div>

      {/* CTA when block is done */}
      {blockDone && !isLastBlock && (
        <button
          onClick={onNext}
          className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-semibold transition-colors mt-1"
        >
          Next block →
        </button>
      )}
      {blockDone && isLastBlock && (
        <div className="w-full py-4 text-center rounded-2xl bg-green-50 border border-green-200">
          <p className="text-green-700 font-semibold">Workout complete! 💪</p>
          <p className="text-xs text-green-500 mt-0.5">Finish the session in the header</p>
        </div>
      )}
    </div>
  );
}
