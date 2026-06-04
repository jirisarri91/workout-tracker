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
  onExerciseDone: (planExerciseId: string) => void;
  onUndoExercise: (planExerciseId: string) => void;
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
  onExerciseDone,
  onUndoExercise,
  onNext,
  isLastBlock,
}: Props) {
  function getSessionExercise(planExId: string): WorkoutSessionExercise | null {
    return sessionExercises.find(se => se.workout_plan_exercise_id === planExId) ?? null;
  }

  const blockDone = exercises.every(ex => {
    const se = getSessionExercise(ex.id);
    if (se?.status === 'not_done') return true;
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
        </div>
        {blockDone && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
            Bloque listo ✓
          </span>
        )}
      </div>

      {/* Exercise cards */}
      <div className="flex flex-col gap-2">
        {exercises.map(planEx => {
          const done = Math.min(setsDone[planEx.id] ?? 0, planEx.sets ?? 1);
          const total = planEx.sets ?? 1;
          const se = getSessionExercise(planEx.id);

          return (
            <CircuitExerciseCard
              key={planEx.id}
              planExercise={planEx}
              sessionExercise={se}
              allExercises={allExercises}
              sessionId={sessionId}
              onEnsureSession={onEnsureSession}
              onUpdated={onUpdated}
              suggestion={suggestions[planEx.exercise_id]}
              setsDone={done}
              totalSets={total}
              onExerciseDone={() => onExerciseDone(planEx.id)}
              onUndoExercise={() => onUndoExercise(planEx.id)}
            />
          );
        })}
      </div>

      {/* CTA when block is done */}
      {blockDone && !isLastBlock && (
        <button
          onClick={onNext}
          className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-semibold transition-colors mt-1"
        >
          Siguiente bloque →
        </button>
      )}
      {blockDone && isLastBlock && (
        <div className="w-full py-4 text-center rounded-2xl bg-green-50 border border-green-200">
          <p className="text-green-700 font-semibold">¡Entreno completo! 💪</p>
          <p className="text-xs text-green-500 mt-0.5">Finalizá la sesión desde el encabezado</p>
        </div>
      )}
    </div>
  );
}
