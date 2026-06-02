'use client';
import { useRef, useState } from 'react';
import { WorkoutSessionExercise } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface Props {
  sessionExercise: WorkoutSessionExercise;
  onUpdated: () => void;
}

export function OrphanedSessionExerciseCard({ sessionExercise, onUpdated }: Props) {
  const [localWeight, setLocalWeight] = useState(sessionExercise.actual_weight?.toString() ?? '');
  const [localObs, setLocalObs] = useState(sessionExercise.observations ?? '');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const exercise = sessionExercise.exercise!;

  function scheduleSave(patch: Partial<WorkoutSessionExercise>) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        await fetch(
          `/api/workout-sessions/${sessionExercise.workout_session_id}/exercises/${sessionExercise.id}`,
          { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }
        );
        onUpdated();
      } catch {
        toast('Error al guardar', 'error');
      }
    }, 700);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 pb-2">
        <span className="font-semibold text-slate-900 text-sm">{exercise.name}</span>
        <div className="flex gap-3 mt-0.5 text-xs text-slate-500">
          {sessionExercise.sets && <span>{sessionExercise.sets} series</span>}
          {sessionExercise.reps && <span>{sessionExercise.reps} reps</span>}
        </div>
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <div className="w-28 shrink-0">
          <Input
            label="Kg real"
            type="number"
            step="0.5"
            placeholder="0"
            value={localWeight}
            onChange={e => {
              setLocalWeight(e.target.value);
              scheduleSave({ actual_weight: e.target.value ? parseFloat(e.target.value) : null });
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
              scheduleSave({ observations: e.target.value });
            }}
          />
        </div>
      </div>
    </div>
  );
}
