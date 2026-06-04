'use client';
import { useState } from 'react';
import { Exercise, WorkoutPlanExercise, WorkoutSessionExercise, ProgressSuggestion } from '@/types';
import { ExerciseInstructions } from './ExerciseInstructions';
import { ExercisePicker } from './ExercisePicker';
import { Input, Textarea } from '@/components/ui/Input';
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
  onExerciseDone: () => void;
  onUndoExercise: () => void;
}

function fmtDuration(s: number | null | undefined): string | null {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`;
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
  onExerciseDone,
  onUndoExercise,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isPR, setIsPR] = useState(false);

  // Complete-form state
  const [formSets, setFormSets] = useState(String(planExercise.sets ?? 1));
  const [formWeight, setFormWeight] = useState(suggestion?.lastWeight ? String(suggestion.lastWeight) : '');
  const [formDuration, setFormDuration] = useState(
    suggestion?.lastDuration ? String(suggestion.lastDuration) : (planExercise.duration_seconds ? String(planExercise.duration_seconds) : '')
  );
  const [formObs, setFormObs] = useState(sessionExercise?.observations ?? '');

  // Edit-mode state (for done exercises)
  const [editSets, setEditSets] = useState(String(sessionExercise?.sets ?? planExercise.sets ?? 1));
  const [editWeight, setEditWeight] = useState(sessionExercise?.actual_weight?.toString() ?? '');
  const [editDuration, setEditDuration] = useState(sessionExercise?.duration_seconds?.toString() ?? '');
  const [editObs, setEditObs] = useState(sessionExercise?.observations ?? '');

  const { toast } = useToast();

  const exercise = planExercise.exercise!;
  const replacedExercise = sessionExercise?.replaced_exercise ?? null;
  const displayExercise = replacedExercise ?? exercise;
  const currentStatus = sessionExercise?.status ?? null;
  const isExerciseDone = setsDone >= totalSets;
  const isSkipped = currentStatus === 'not_done';

  const hasDuration = !!planExercise.duration_seconds || !!suggestion?.lastDuration;
  const videoResource = displayExercise.resources?.find(r =>
    r.url.includes('youtube') || r.url.includes('youtu.be') || r.url.includes('vimeo') || r.url.toLowerCase().includes('video')
  ) ?? displayExercise.resources?.[0] ?? null;

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

  async function handleCompleteSubmit() {
    try {
      const sets = parseInt(formSets) || planExercise.sets || 1;
      await upsertSessionExercise({
        status: 'done',
        sets,
        actual_weight: formWeight ? parseFloat(formWeight) : null,
        duration_seconds: formDuration ? parseInt(formDuration) : null,
        observations: formObs || null,
      });
      setShowCompleteForm(false);
      onExerciseDone();
    } catch {
      toast('Error al guardar', 'error');
    }
  }

  async function handleEditSave() {
    try {
      await upsertSessionExercise({
        sets: parseInt(editSets) || planExercise.sets || 1,
        actual_weight: editWeight ? parseFloat(editWeight) : null,
        duration_seconds: editDuration ? parseInt(editDuration) : null,
        observations: editObs || null,
      });
      setShowEdit(false);
    } catch {
      toast('Error al guardar', 'error');
    }
  }

  async function handleUndoDone() {
    try {
      const sid = sessionId || (await onEnsureSession());
      if (sessionExercise) {
        await fetch(`/api/workout-sessions/${sid}/exercises/${sessionExercise.id}`, { method: 'DELETE' });
      }
      setShowCompleteForm(false);
      setFormSets(String(planExercise.sets ?? 1));
      setFormWeight(suggestion?.lastWeight ? String(suggestion.lastWeight) : '');
      setFormDuration(
        suggestion?.lastDuration ? String(suggestion.lastDuration) : (planExercise.duration_seconds ? String(planExercise.duration_seconds) : '')
      );
      setFormObs('');
      onUndoExercise();
      onUpdated();
    } catch {
      toast('Error al deshacer', 'error');
    }
  }

  async function handleSkip() {
    try {
      await upsertSessionExercise({ status: 'not_done' });
    } catch {
      toast('Error al guardar', 'error');
    }
  }

  async function handleUnskip() {
    try {
      await upsertSessionExercise({ status: 'done' });
    } catch {
      toast('Error al guardar', 'error');
    }
  }

  async function handleReplace(ex: Exercise) {
    try {
      await upsertSessionExercise({ status: 'replaced', replaced_exercise_id: ex.id });
    } catch {
      toast('Error al guardar', 'error');
    }
    setShowPicker(false);
  }

  const lastWeightDisplay = suggestion?.lastWeight != null ? `${suggestion.lastWeight}kg` : '0kg';
  const lastDurationDisplay = suggestion?.lastDuration != null ? (fmtDuration(suggestion.lastDuration) ?? '0') : '0';

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
            {/* Quick video link */}
            {videoResource && (
              <a
                href={videoResource.url}
                target="_blank"
                rel="noopener noreferrer"
                title={videoResource.title || 'Ver video'}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </a>
            )}
          </div>

          {/* Plan info: sets (suggested), reps, last weight, last duration */}
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
            {planExercise.sets && (
              <span className="font-medium">Series sugeridas: {planExercise.sets}</span>
            )}
            {planExercise.reps && (
              <span>· {planExercise.reps} reps</span>
            )}
            {(planExercise.target_weight != null || suggestion?.lastWeight != null) && (
              <span>· último peso: <span className="text-slate-700 font-medium">{lastWeightDisplay}</span></span>
            )}
            {hasDuration && (
              <span>· último tiempo: <span className="text-slate-700 font-medium">{lastDurationDisplay}</span></span>
            )}
            {suggestion?.suggestedWeight && (
              <span className="text-orange-500 font-medium">→ probar {suggestion.suggestedWeight}kg</span>
            )}
          </div>
        </div>

        {/* Right-side indicator */}
        {isExerciseDone && !showEdit && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 font-bold">✓</span>
          </div>
        )}
        {isSkipped && (
          <button
            onClick={handleUnskip}
            className="shrink-0 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg border border-slate-200 hover:border-slate-300"
          >
            deshacer
          </button>
        )}
      </div>

      {/* Active (not done, not skipped): complete form or trigger button */}
      {!isExerciseDone && !isSkipped && (
        <div className="px-4 pb-3 space-y-2">
          {!showCompleteForm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCompleteForm(true)}
                className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                Completar ejercicio ✓
              </button>
              <button
                onClick={handleSkip}
                title="Omitir ejercicio"
                className="w-9 h-11 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors text-lg"
              >
                ✕
              </button>
              <button
                onClick={() => setShowPicker(true)}
                title="Reemplazar ejercicio"
                className="w-9 h-11 flex items-center justify-center text-slate-300 hover:text-yellow-500 hover:bg-yellow-50 rounded-xl transition-colors text-base"
              >
                ↔
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 bg-orange-50 rounded-xl p-3 border border-orange-100">
              <p className="text-xs font-semibold text-orange-700">Registrar ejercicio</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Series hechas"
                  type="number"
                  min="1"
                  value={formSets}
                  onChange={e => setFormSets(e.target.value)}
                  className="h-9 text-sm"
                />
                <Input
                  label="Peso (kg)"
                  type="number"
                  step="0.5"
                  placeholder="0"
                  value={formWeight}
                  onChange={e => setFormWeight(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              {hasDuration && (
                <Input
                  label="Tiempo (seg)"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formDuration}
                  onChange={e => setFormDuration(e.target.value)}
                  className="h-9 text-sm"
                />
              )}
              <Textarea
                label="Sensaciones (opcional)"
                placeholder="¿Cómo se sintió?"
                value={formObs}
                rows={2}
                className="text-sm"
                onChange={e => setFormObs(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCompleteSubmit}
                  className="flex-1 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowCompleteForm(false)}
                  className="px-4 h-10 text-sm text-slate-500 hover:text-slate-700 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {!!planExercise.rest_seconds && !showCompleteForm && (
            <p className="text-xs text-slate-400">Descanso: {planExercise.rest_seconds}s después</p>
          )}
        </div>
      )}

      {/* Summary row when done (not editing) */}
      {isExerciseDone && !showEdit && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{sessionExercise?.sets ?? totalSets} series</span>
            {sessionExercise?.actual_weight && (
              <span>· <span className="text-slate-700 font-medium">{sessionExercise.actual_weight}kg</span></span>
            )}
            {sessionExercise?.duration_seconds && (
              <span>· <span className="text-slate-700 font-medium">{fmtDuration(sessionExercise.duration_seconds)}</span></span>
            )}
            {sessionExercise?.observations && (
              <span className="text-slate-400 truncate max-w-[100px]">· {sessionExercise.observations}</span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => {
                  setEditSets(String(sessionExercise?.sets ?? totalSets));
                  setEditWeight(sessionExercise?.actual_weight?.toString() ?? '');
                  setEditDuration(sessionExercise?.duration_seconds?.toString() ?? '');
                  setEditObs(sessionExercise?.observations ?? '');
                  setShowEdit(true);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              >
                editar
              </button>
              <button
                onClick={handleUndoDone}
                className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
              >
                deshacer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit mode when done */}
      {isExerciseDone && showEdit && (
        <div className="px-4 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Series"
              type="number"
              min="1"
              value={editSets}
              onChange={e => setEditSets(e.target.value)}
              className="h-9 text-sm"
            />
            <Input
              label="Peso (kg)"
              type="number"
              step="0.5"
              placeholder="0"
              value={editWeight}
              onChange={e => setEditWeight(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          {hasDuration && (
            <Input
              label="Tiempo (seg)"
              type="number"
              min="0"
              placeholder="0"
              value={editDuration}
              onChange={e => setEditDuration(e.target.value)}
              className="h-9 text-sm"
            />
          )}
          <Textarea
            label="Sensaciones"
            placeholder="¿Cómo se sintió?"
            value={editObs}
            rows={2}
            className="text-sm"
            onChange={e => setEditObs(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleEditSave}
              className="flex-1 h-9 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Guardar cambios
            </button>
            <button
              onClick={() => setShowEdit(false)}
              className="px-3 h-9 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← cancelar
            </button>
          </div>
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
