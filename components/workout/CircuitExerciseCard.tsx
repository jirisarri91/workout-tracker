'use client';
import { useState, useRef } from 'react';
import { Exercise, WorkoutPlanExercise, WorkoutSessionExercise, ProgressSuggestion } from '@/types';
import { ExerciseInstructions } from './ExerciseInstructions';
import { ExercisePicker } from './ExercisePicker';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface Props {
  planExercise: WorkoutPlanExercise;
  sessionExercise: WorkoutSessionExercise | null;
  allExercises: Exercise[];
  sessionId: string;
  onEnsureSession: () => Promise<string>;
  onUpdated: () => void;
  suggestion?: ProgressSuggestion;
  setsDone: number;
  totalSets: number;
  onSetComplete: () => void;
}

export function CircuitExerciseCard({
  planExercise,
  sessionExercise,
  allExercises,
  sessionId,
  onEnsureSession,
  onUpdated,
  suggestion,
  setsDone,
  totalSets,
  onSetComplete,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [localWeight, setLocalWeight] = useState(sessionExercise?.actual_weight?.toString() ?? '');
  const [isPR, setIsPR] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const exercise = planExercise.exercise!;
  const replacedExercise = sessionExercise?.replaced_exercise ?? null;
  const displayExercise = replacedExercise ?? exercise;
  const currentStatus = sessionExercise?.status ?? null;
  const isExerciseDone = setsDone >= totalSets;
  const isSkipped = currentStatus === 'not_done';

  function fmtDuration(s: number | null) {
    if (!s) return null;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`;
  }

  async function upsertSessionExercise(patch: Record<string, unknown>) {
    const sid = sessionId || (await onEnsureSession());
    if (sessionExercise) {
      const res = await fetch(`/api/workout-sessions/${sid}/exercises/${sessionExercise.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      if (updated.isPR) setIsPR(true);
    } else {
      const body = {
        workout_session_id: sid,
        workout_plan_exercise_id: planExercise.id,
        exercise_id: planExercise.exercise_id,
        order_index: planExercise.order_index,
        sets: planExercise.sets,
        reps: planExercise.reps,
        ...patch,
      };
      const res = await fetch(`/api/workout-sessions/${sid}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const created = await res.json();
      if (created.isPR) setIsPR(true);
    }
    onUpdated();
  }

  async function handleSkip() {
    try {
      await upsertSessionExercise({ status: 'not_done' });
    } catch {
      toast('Failed to save', 'error');
    }
  }

  async function handleUnskip() {
    try {
      await upsertSessionExercise({ status: 'done' });
    } catch {
      toast('Failed to save', 'error');
    }
  }

  async function handleReplace(ex: Exercise) {
    try {
      await upsertSessionExercise({ status: 'replaced', replaced_exercise_id: ex.id });
    } catch {
      toast('Failed to save', 'error');
    }
    setShowPicker(false);
  }

  function scheduleWeightSave(val: string) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        await upsertSessionExercise({ actual_weight: val ? parseFloat(val) : null });
      } catch {
        toast('Failed to save', 'error');
      }
    }, 700);
  }

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isExerciseDone
        ? 'bg-green-50 border-green-200'
        : isSkipped
        ? 'bg-slate-50 border-slate-200 opacity-60'
        : 'bg-white border-slate-100 shadow-sm'
    }`}>
      {/* Header: name + meta */}
      <div className="flex items-start gap-2 p-4 pb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ExerciseInstructions exercise={displayExercise} />
            <span className="font-semibold text-slate-900 text-sm">{displayExercise.name}</span>
            {replacedExercise && (
              <span className="text-xs text-slate-400">↔ {exercise.name}</span>
            )}
            {isPR && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                PR 🏆
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
            {planExercise.sets && planExercise.reps && (
              <span className="font-medium">{planExercise.sets}×{planExercise.reps}</span>
            )}
            {planExercise.duration_seconds && (
              <span className="font-medium">{fmtDuration(planExercise.duration_seconds)}</span>
            )}
            {planExercise.target_weight && (
              <span>· {planExercise.target_weight}kg target</span>
            )}
            {suggestion?.suggestedWeight ? (
              <span className="text-orange-500 font-medium">→ try {suggestion.suggestedWeight}kg</span>
            ) : suggestion?.lastWeight ? (
              <span>· last {suggestion.lastWeight}kg</span>
            ) : null}
          </div>
        </div>

        {/* Right side state indicator */}
        {isExerciseDone && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 font-bold">✓</span>
          </div>
        )}
        {isSkipped && (
          <button
            onClick={handleUnskip}
            className="shrink-0 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg border border-slate-200 hover:border-slate-300"
          >
            undo skip
          </button>
        )}
      </div>

      {/* Set tracking row (when active) */}
      {!isExerciseDone && !isSkipped && (
        <div className="px-4 pb-3 space-y-2">
          <div className="flex items-center gap-3">
            {/* Set dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSets }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${
                    i < setsDone
                      ? 'w-3 h-3 bg-orange-400'
                      : i === setsDone
                      ? 'w-3 h-3 bg-slate-200 ring-2 ring-orange-300 ring-offset-1'
                      : 'w-2.5 h-2.5 bg-slate-200'
                  }`}
                />
              ))}
              <span className="text-xs text-slate-400 ml-0.5 tabular-nums">{setsDone}/{totalSets}</span>
            </div>

            {/* Complete set button */}
            <button
              onClick={onSetComplete}
              className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              Set {setsDone + 1} done ✓
            </button>

            {/* Skip */}
            <button
              onClick={handleSkip}
              title="Skip exercise"
              className="w-9 h-11 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors text-lg"
            >
              ✕
            </button>

            {/* Replace */}
            <button
              onClick={() => setShowPicker(true)}
              title="Replace exercise"
              className="w-9 h-11 flex items-center justify-center text-slate-300 hover:text-yellow-500 hover:bg-yellow-50 rounded-xl transition-colors text-base"
            >
              ↔
            </button>
          </div>

          {/* Weight input */}
          <div className="flex items-center gap-3">
            <div className="w-32">
              <Input
                label="Actual kg"
                type="number"
                step="0.5"
                placeholder={planExercise.target_weight?.toString() ?? '0'}
                value={localWeight}
                onChange={e => {
                  setLocalWeight(e.target.value);
                  scheduleWeightSave(e.target.value);
                }}
                className="h-9 text-sm"
              />
            </div>
            {planExercise.rest_seconds && (
              <p className="text-xs text-slate-400 mt-4">Rest: {planExercise.rest_seconds}s after</p>
            )}
          </div>
        </div>
      )}

      {/* Summary row when done */}
      {isExerciseDone && (
        <div className="px-4 pb-3 flex items-center gap-3 text-xs text-slate-500">
          {Array.from({ length: totalSets }).map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-green-400" />
          ))}
          {localWeight && <span className="ml-1 font-medium text-slate-600">{localWeight}kg</span>}
        </div>
      )}

      {showPicker && (
        <ExercisePicker
          exercises={allExercises}
          onSelect={handleReplace}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
