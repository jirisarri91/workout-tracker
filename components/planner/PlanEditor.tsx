'use client';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { WorkoutPlan, WorkoutPlanExercise, Exercise } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';

interface Props {
  date: string;
  plan: WorkoutPlan | null | undefined;
  allExercises: Exercise[];
  onSaved: () => void;
}

export function PlanEditor({ date, plan, allExercises, onSaved }: Props) {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [exercises, setExercises] = useState<WorkoutPlanExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (plan) {
      setName(plan.name ?? '');
      setObjective(plan.objective ?? '');
      setNotes(plan.notes ?? '');
      setStartTime(plan.start_time ?? '');
      setEndTime(plan.end_time ?? '');
      setExercises(plan.exercises ?? []);
    } else {
      setName(''); setObjective(''); setNotes('');
      setStartTime(''); setEndTime(''); setExercises([]);
    }
  }, [plan, date]);

  function updateExercise(idx: number, patch: Partial<WorkoutPlanExercise>) {
    setExercises(exs => exs.map((e, i) => i === idx ? { ...e, ...patch } : e));
  }

  function removeExercise(idx: number) {
    setExercises(exs => exs.filter((_, i) => i !== idx));
  }

  function moveExercise(idx: number, dir: -1 | 1) {
    setExercises(exs => {
      const next = [...exs];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return next;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((e, i) => ({ ...e, order_index: i }));
    });
  }

  function addExercise(ex: Exercise) {
    const newEx: WorkoutPlanExercise = {
      id: `temp-${Date.now()}`,
      workout_plan_id: plan?.id ?? '',
      exercise_id: ex.id,
      order_index: exercises.length,
      sets: 3,
      reps: 10,
      duration_seconds: null,
      target_weight: null,
      rest_seconds: 90,
      notes: null,
      created_at: new Date().toISOString(),
      exercise: ex,
    };
    setExercises(exs => [...exs, newEx]);
  }

  async function save() {
    setSaving(true);
    try {
      const body = {
        date,
        name: name || null,
        objective: objective || null,
        notes: notes || null,
        start_time: startTime || null,
        end_time: endTime || null,
        exercises: exercises.map((e, i) => ({
          id: e.id.startsWith('temp-') ? undefined : e.id,
          exercise_id: e.exercise_id,
          order_index: i,
          sets: e.sets,
          reps: e.reps,
          duration_seconds: e.duration_seconds,
          target_weight: e.target_weight,
          rest_seconds: e.rest_seconds,
          notes: e.notes,
        })),
      };

      if (plan) {
        await fetch(`/api/workout-plans/${plan.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/workout-plans', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      }
      toast('Plan saved!');
      onSaved();
    } catch { toast('Failed to save plan', 'error'); }
    finally { setSaving(false); }
  }

  const displayDate = format(parseISO(date), 'EEEE, MMMM d, yyyy');

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h2 className="font-semibold text-slate-900 mb-3">{displayDate}</h2>
        <div className="flex flex-col gap-3">
          <Input label="Workout name" placeholder="e.g. Push Day A" value={name} onChange={e => setName(e.target.value)} />
          <Textarea label="Objective" placeholder="Goals for this session..." value={objective} rows={2} onChange={e => setObjective(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Start time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <Input label="End time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
          <Textarea label="General notes" placeholder="Any extra notes..." value={notes} rows={2} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      {/* Exercises */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Exercises</h3>
          <Button size="sm" variant="outline" onClick={() => setShowPicker(true)}>+ Add exercise</Button>
        </div>

        {exercises.map((ex, idx) => {
          const exercise = ex.exercise ?? allExercises.find(e => e.id === ex.exercise_id);
          return (
            <div key={ex.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-medium text-slate-900 text-sm flex-1">{exercise?.name ?? 'Unknown'}</span>
                {exercise && exercise.muscle_groups?.length > 0 && (
                  <Badge color="gray">{exercise.muscle_groups[0]}</Badge>
                )}
                <div className="flex gap-0.5">
                  <button onClick={() => moveExercise(idx, -1)} disabled={idx === 0} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30">
                    ↑
                  </button>
                  <button onClick={() => moveExercise(idx, 1)} disabled={idx === exercises.length - 1} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30">
                    ↓
                  </button>
                  <button onClick={() => removeExercise(idx)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                    ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input label="Sets" type="number" min="1" value={ex.sets?.toString() ?? ''} onChange={e => updateExercise(idx, { sets: parseInt(e.target.value) || null })} />
                <Input label="Reps" type="number" min="1" value={ex.reps?.toString() ?? ''} onChange={e => updateExercise(idx, { reps: parseInt(e.target.value) || null })} />
                <Input label="Target weight (kg)" type="number" step="0.5" value={ex.target_weight?.toString() ?? ''} onChange={e => updateExercise(idx, { target_weight: parseFloat(e.target.value) || null })} />
                <Input label="Rest (sec)" type="number" value={ex.rest_seconds?.toString() ?? ''} onChange={e => updateExercise(idx, { rest_seconds: parseInt(e.target.value) || null })} />
                <Input label="Duration (sec)" type="number" value={ex.duration_seconds?.toString() ?? ''} onChange={e => updateExercise(idx, { duration_seconds: parseInt(e.target.value) || null })} className="col-span-2" />
              </div>
            </div>
          );
        })}

        {exercises.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            No exercises yet. Add one above.
          </div>
        )}
      </div>

      <Button onClick={save} loading={saving} size="lg" className="w-full">
        Save Plan
      </Button>

      {showPicker && (
        <ExercisePicker
          exercises={allExercises}
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
