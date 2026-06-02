'use client';
import { useState, useRef } from 'react';
import { Exercise, WorkoutPlanExercise, WorkoutSessionExercise, ExerciseStatus, ProgressSuggestion } from '@/types';
import { ExerciseInstructions } from './ExerciseInstructions';
import { ExercisePicker } from './ExercisePicker';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface Props {
  planExercise: WorkoutPlanExercise;
  sessionExercise: WorkoutSessionExercise | null;
  allExercises: Exercise[];
  sessionId: string;
  onEnsureSession: () => Promise<string>;
  onUpdated: () => void;
  suggestion?: ProgressSuggestion;
}

const STATUS_CONFIG: Record<ExerciseStatus, { label: string; color: 'green' | 'red' | 'yellow'; emoji: string }> = {
  done: { label: 'Listo', color: 'green', emoji: '✓' },
  not_done: { label: 'Omitido', color: 'red', emoji: '✕' },
  replaced: { label: 'Reemplazado', color: 'yellow', emoji: '↔' },
};

export function ExerciseCard({ planExercise, sessionExercise, allExercises, sessionId, onEnsureSession, onUpdated, suggestion }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [localWeight, setLocalWeight] = useState(sessionExercise?.actual_weight?.toString() ?? '');
  const [localObs, setLocalObs] = useState(sessionExercise?.observations ?? '');
  const [isPR, setIsPR] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const exercise = planExercise.exercise!;
  const currentStatus = sessionExercise?.status ?? 'done';
  const replacedExercise = sessionExercise?.replaced_exercise ?? null;
  const displayExercise = replacedExercise ?? exercise;

  async function upsertSessionExercise(patch: Partial<WorkoutSessionExercise>) {
    if (sessionExercise) {
      const res = await fetch(`/api/workout-sessions/${sessionId}/exercises/${sessionExercise.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      if (updated.isPR) setIsPR(true);
    } else {
      const sid = sessionId || await onEnsureSession();
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

  async function setStatus(status: ExerciseStatus) {
    try {
      if (status === 'replaced') {
        setShowPicker(true);
        return;
      }
      await upsertSessionExercise({ status });
    } catch { toast('Error al guardar', 'error'); }
  }

  async function handleReplace(ex: Exercise) {
    try {
      await upsertSessionExercise({ status: 'replaced', replaced_exercise_id: ex.id });
    } catch { toast('Error al guardar', 'error'); }
  }

  function scheduleFieldSave(patch: Partial<WorkoutSessionExercise>) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try { await upsertSessionExercise(patch); }
      catch { toast('Error al guardar', 'error'); }
    }, 700);
  }

  const sets = planExercise.sets;
  const reps = planExercise.reps;
  const targetWeight = planExercise.target_weight;
  const targetDuration = planExercise.duration_seconds;

  function fmtDuration(s: number | null) {
    if (!s) return null;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`;
  }

  const statusBgClass =
    currentStatus === 'not_done' ? 'opacity-60' :
    currentStatus === 'replaced' ? 'border-l-4 border-yellow-400' : '';

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${statusBgClass}`}>
      {/* Row 1: name + status */}
      <div className="flex items-start gap-2 p-4 pb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm">{displayExercise.name}</span>
            {replacedExercise && (
              <Badge color="yellow">reemplaza a {exercise.name}</Badge>
            )}
            {isPR && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">PR 🏆</span>
            )}
            <ExerciseInstructions exercise={displayExercise} />
          </div>
        </div>

        {/* Status controls */}
        <div className="flex gap-1 shrink-0">
          {(['done', 'not_done', 'replaced'] as ExerciseStatus[]).map(s => {
            const cfg = STATUS_CONFIG[s];
            const active = currentStatus === s;
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                title={cfg.label}
                className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors
                  ${active
                    ? s === 'done' ? 'bg-green-100 text-green-700' : s === 'not_done' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
              >
                {cfg.emoji}
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggestion row */}
      {suggestion && (suggestion.lastWeight || suggestion.suggestedWeight) && (
        <div className="px-4 pb-1 flex items-center gap-3 text-xs text-slate-400">
          {suggestion.lastWeight && <span>Última: <span className="text-slate-600 font-medium">{suggestion.lastWeight}kg</span></span>}
          {suggestion.suggestedWeight && <span>Sugerida: <span className="text-orange-500 font-medium">{suggestion.suggestedWeight}kg</span></span>}
        </div>
      )}

      {/* Row 2: sets, reps, weights */}
      <div className="grid grid-cols-4 gap-2 px-4 pb-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400 font-medium">Series</span>
          <span className="text-slate-800 font-semibold">{sets ?? '—'}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400 font-medium">Reps</span>
          <span className="text-slate-800 font-semibold">{reps ?? '—'}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400 font-medium">Obj. kg</span>
          <span className="text-slate-800 font-semibold">{targetWeight ?? '—'}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400 font-medium">Tiempo</span>
          <span className="text-slate-800 font-semibold">{fmtDuration(targetDuration) ?? '—'}</span>
        </div>
      </div>

      {/* Row 3: editable actual weight + observations */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="w-28 shrink-0">
            <Input
              label="Kg real"
              type="number"
              step="0.5"
              placeholder={targetWeight?.toString() ?? '0'}
              value={localWeight}
              onChange={e => {
                setLocalWeight(e.target.value);
                scheduleFieldSave({ actual_weight: e.target.value ? parseFloat(e.target.value) : null });
              }}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex-1">
            <Textarea
              label="Observaciones"
              placeholder="¿Cómo se sintió?"
              value={localObs}
              rows={2}
              className="text-sm"
              onChange={e => {
                setLocalObs(e.target.value);
                scheduleFieldSave({ observations: e.target.value });
              }}
            />
          </div>
        </div>
      </div>

      {/* Exercise picker modal */}
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
