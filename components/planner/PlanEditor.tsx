'use client';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { WorkoutPlan, WorkoutPlanExercise, Exercise } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { CopyPlanModal } from '@/components/planner/CopyPlanModal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface Props {
  date: string;
  plan: WorkoutPlan | null | undefined;
  allExercises: Exercise[];
  allPlans: WorkoutPlan[];
  onSaved: () => void;
}

// Sentinel value meaning "picker is closed"
const PICKER_CLOSED = '__closed__' as const;

export function PlanEditor({ date, plan, allExercises, allPlans, onSaved }: Props) {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [exercises, setExercises] = useState<WorkoutPlanExercise[]>([]);
  const [blockNames, setBlockNames] = useState<string[]>([]);
  // null = ungrouped section, string = named block, PICKER_CLOSED = not open
  const [pickerForBlock, setPickerForBlock] = useState<string | null | typeof PICKER_CLOSED>(PICKER_CLOSED);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (plan) {
      setName(plan.name ?? '');
      setObjective(plan.objective ?? '');
      setNotes(plan.notes ?? '');
      setStartTime(plan.start_time ?? '');
      setEndTime(plan.end_time ?? '');
      const exs = plan.exercises ?? [];
      setExercises(exs);
      const names: string[] = [];
      for (const e of exs) {
        if (e.block_name && !names.includes(e.block_name)) names.push(e.block_name);
      }
      setBlockNames(names);
    } else {
      setName(''); setObjective(''); setNotes('');
      setStartTime(''); setEndTime('');
      setExercises([]); setBlockNames([]);
    }
  }, [plan, date]);

  function updateExercise(id: string, patch: Partial<WorkoutPlanExercise>) {
    setExercises(exs => exs.map(e => e.id === id ? { ...e, ...patch } : e));
  }

  function removeExercise(id: string) {
    setExercises(exs => exs.filter(e => e.id !== id));
  }

  function moveExerciseInBlock(id: string, blockName: string | null, dir: -1 | 1) {
    setExercises(prev => {
      const blockExs = prev.filter(e => e.block_name === blockName);
      const blockIdx = blockExs.findIndex(e => e.id === id);
      const targetBlockIdx = blockIdx + dir;
      if (targetBlockIdx < 0 || targetBlockIdx >= blockExs.length) return prev;
      const idxA = prev.findIndex(e => e.id === id);
      const idxB = prev.findIndex(e => e.id === blockExs[targetBlockIdx].id);
      const next = [...prev];
      [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
      return next;
    });
  }

  function addExercise(ex: Exercise, blockName: string | null) {
    const newEx: WorkoutPlanExercise = {
      id: `temp-${Date.now()}`,
      workout_plan_id: plan?.id ?? '',
      exercise_id: ex.id,
      block_name: blockName,
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
    setPickerForBlock(PICKER_CLOSED);
  }

  function addBlock() {
    const trimmed = newBlockName.trim();
    if (!trimmed || blockNames.includes(trimmed)) return;
    setBlockNames(names => [...names, trimmed]);
    setNewBlockName('');
    setShowAddBlock(false);
  }

  function deleteBlock(bn: string) {
    setBlockNames(names => names.filter(n => n !== bn));
    setExercises(exs => exs.map(e => e.block_name === bn ? { ...e, block_name: null } : e));
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    setBlockNames(names => {
      const next = [...names];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return next;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const ungrouped = exercises.filter(e => !e.block_name);
      const grouped = blockNames.flatMap(bn => exercises.filter(e => e.block_name === bn));
      const ordered = [...ungrouped, ...grouped];

      const body = {
        date,
        name: name || null,
        objective: objective || null,
        notes: notes || null,
        start_time: startTime || null,
        end_time: endTime || null,
        exercises: ordered.map((e, i) => ({
          id: e.id.startsWith('temp-') ? undefined : e.id,
          exercise_id: e.exercise_id,
          block_name: e.block_name,
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
    } catch {
      toast('Failed to save plan', 'error');
    } finally {
      setSaving(false);
    }
  }

  const displayDate = format(parseISO(date), 'EEEE, MMMM d, yyyy');
  const ungroupedExercises = exercises.filter(e => !e.block_name);

  function renderExerciseCard(ex: WorkoutPlanExercise, blockName: string | null, blockExercises: WorkoutPlanExercise[]) {
    const exercise = ex.exercise ?? allExercises.find(e => e.id === ex.exercise_id);
    const idxInBlock = blockExercises.findIndex(e => e.id === ex.id);

    return (
      <div key={ex.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-medium text-slate-900 text-sm flex-1">{exercise?.name ?? 'Unknown'}</span>
          {exercise && exercise.muscle_groups?.length > 0 && (
            <Badge color="gray">{exercise.muscle_groups[0]}</Badge>
          )}
          <div className="flex gap-0.5">
            <button
              onClick={() => moveExerciseInBlock(ex.id, blockName, -1)}
              disabled={idxInBlock === 0}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30"
            >↑</button>
            <button
              onClick={() => moveExerciseInBlock(ex.id, blockName, 1)}
              disabled={idxInBlock === blockExercises.length - 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30"
            >↓</button>
            <button
              onClick={() => removeExercise(ex.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
            >✕</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input label="Sets" type="number" min="1" value={ex.sets?.toString() ?? ''} onChange={e => updateExercise(ex.id, { sets: parseInt(e.target.value) || null })} />
          <Input label="Reps" type="number" min="1" value={ex.reps?.toString() ?? ''} onChange={e => updateExercise(ex.id, { reps: parseInt(e.target.value) || null })} />
          <Input label="Target weight (kg)" type="number" step="0.5" value={ex.target_weight?.toString() ?? ''} onChange={e => updateExercise(ex.id, { target_weight: parseFloat(e.target.value) || null })} />
          <Input label="Rest (sec)" type="number" value={ex.rest_seconds?.toString() ?? ''} onChange={e => updateExercise(ex.id, { rest_seconds: parseInt(e.target.value) || null })} />
          <Input label="Duration (sec)" type="number" value={ex.duration_seconds?.toString() ?? ''} onChange={e => updateExercise(ex.id, { duration_seconds: parseInt(e.target.value) || null })} className="col-span-2" />
        </div>

        {blockNames.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <select
              value={ex.block_name ?? ''}
              onChange={e => updateExercise(ex.id, { block_name: e.target.value || null })}
              className="w-full text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">No block</option>
              {blockNames.map(bn => (
                <option key={bn} value={bn}>{bn}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Plan metadata */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">{displayDate}</h2>
          {plan && (
            <button
              onClick={() => setShowCopyModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy to days
            </button>
          )}
        </div>
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

      {/* Ungrouped exercises */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">
            {blockNames.length > 0 ? 'Ungrouped' : 'Exercises'}
          </h3>
          <Button size="sm" variant="outline" onClick={() => setPickerForBlock(null)}>+ Add exercise</Button>
        </div>

        {ungroupedExercises.map(ex => renderExerciseCard(ex, null, ungroupedExercises))}

        {ungroupedExercises.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            No exercises yet. Add one above.
          </div>
        )}
      </div>

      {/* Named blocks */}
      {blockNames.map((blockName, blockIdx) => {
        const blockExercises = exercises.filter(e => e.block_name === blockName);
        return (
          <div key={blockName} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                <button
                  onClick={() => moveBlock(blockIdx, -1)}
                  disabled={blockIdx === 0}
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30 text-xs"
                >↑</button>
                <button
                  onClick={() => moveBlock(blockIdx, 1)}
                  disabled={blockIdx === blockNames.length - 1}
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30 text-xs"
                >↓</button>
              </div>
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <h3 className="font-semibold text-slate-800 flex-1">{blockName}</h3>
              <Button size="sm" variant="outline" onClick={() => setPickerForBlock(blockName)}>+ Add</Button>
              <button
                onClick={() => deleteBlock(blockName)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
              >✕</button>
            </div>

            {blockExercises.map(ex => renderExerciseCard(ex, blockName, blockExercises))}

            {blockExercises.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
                No exercises in this block.
              </div>
            )}
          </div>
        );
      })}

      {/* Add block */}
      {showAddBlock ? (
        <div className="flex gap-2 items-end">
          <Input
            label="Block name"
            placeholder="e.g. Warm-up, Strength, Accessory"
            value={newBlockName}
            onChange={e => setNewBlockName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') addBlock();
              if (e.key === 'Escape') { setShowAddBlock(false); setNewBlockName(''); }
            }}
            autoFocus
            className="flex-1"
          />
          <Button size="sm" onClick={addBlock} disabled={!newBlockName.trim()}>Add</Button>
          <Button size="sm" variant="outline" onClick={() => { setShowAddBlock(false); setNewBlockName(''); }}>Cancel</Button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddBlock(true)}
          className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-orange-600 border border-dashed border-slate-300 hover:border-orange-300 rounded-2xl px-4 py-3 transition-colors"
        >
          <span className="text-base leading-none font-medium">+</span>
          Add block
        </button>
      )}

      <Button onClick={save} loading={saving} size="lg" className="w-full">
        Save Plan
      </Button>

      {pickerForBlock !== PICKER_CLOSED && (
        <ExercisePicker
          exercises={allExercises}
          onSelect={ex => addExercise(ex, pickerForBlock)}
          onClose={() => setPickerForBlock(PICKER_CLOSED)}
        />
      )}

      {showCopyModal && plan && (
        <CopyPlanModal
          plan={plan}
          existingPlans={allPlans}
          onClose={() => setShowCopyModal(false)}
          onCopied={onSaved}
        />
      )}
    </div>
  );
}
