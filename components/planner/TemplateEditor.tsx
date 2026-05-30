'use client';
import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { WorkoutTemplate, WorkoutTemplateExercise, Exercise } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { useToast } from '@/components/ui/Toast';

interface Props {
  template: WorkoutTemplate | null;
  allExercises: Exercise[];
  onSaved: (template: WorkoutTemplate) => void;
  onCancel: () => void;
}

const PICKER_CLOSED = '__closed__' as const;

function DragHandle({ listeners, attributes }: { listeners: DraggableSyntheticListeners; attributes: DraggableAttributes }) {
  return (
    <button
      {...listeners}
      {...attributes}
      className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none"
      tabIndex={-1}
      aria-label="Drag to reorder"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <circle cx="4" cy="3" r="1.2" /><circle cx="10" cy="3" r="1.2" />
        <circle cx="4" cy="7" r="1.2" /><circle cx="10" cy="7" r="1.2" />
        <circle cx="4" cy="11" r="1.2" /><circle cx="10" cy="11" r="1.2" />
      </svg>
    </button>
  );
}

interface ExCardProps {
  ex: WorkoutTemplateExercise;
  allExercises: Exercise[];
  blockNames: string[];
  onUpdate: (id: string, patch: Partial<WorkoutTemplateExercise>) => void;
  onRemove: (id: string) => void;
  dragHandle?: React.ReactNode;
  overlay?: boolean;
}

function ExerciseCardContent({ ex, allExercises, blockNames, onUpdate, onRemove, dragHandle }: ExCardProps) {
  const exercise = ex.exercise ?? allExercises.find(e => e.id === ex.exercise_id);
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center gap-1 mb-3">
        {dragHandle}
        <span className="font-medium text-slate-900 text-sm flex-1">{exercise?.name ?? 'Unknown'}</span>
        {exercise && exercise.muscle_groups?.length > 0 && (
          <Badge color="gray">{exercise.muscle_groups[0]}</Badge>
        )}
        <button
          onClick={() => onRemove(ex.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
        >✕</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Sets" type="number" min="1" value={ex.sets?.toString() ?? ''} onChange={e => onUpdate(ex.id, { sets: parseInt(e.target.value) || null })} />
        <Input label="Reps" type="number" min="1" value={ex.reps?.toString() ?? ''} onChange={e => onUpdate(ex.id, { reps: parseInt(e.target.value) || null })} />
        <Input label="Target weight (kg)" type="number" step="0.5" value={ex.target_weight?.toString() ?? ''} onChange={e => onUpdate(ex.id, { target_weight: parseFloat(e.target.value) || null })} />
        <Input label="Rest (sec)" type="number" value={ex.rest_seconds?.toString() ?? ''} onChange={e => onUpdate(ex.id, { rest_seconds: parseInt(e.target.value) || null })} />
        <Input label="Duration (sec)" type="number" value={ex.duration_seconds?.toString() ?? ''} onChange={e => onUpdate(ex.id, { duration_seconds: parseInt(e.target.value) || null })} className="col-span-2" />
      </div>
      {blockNames.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <select
            value={ex.block_name ?? ''}
            onChange={e => onUpdate(ex.id, { block_name: e.target.value || null })}
            className="w-full text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">No block</option>
            {blockNames.map(bn => <option key={bn} value={bn}>{bn}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

function SortableExerciseCard(props: ExCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.ex.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      <ExerciseCardContent {...props} dragHandle={<DragHandle listeners={listeners} attributes={attributes} />} />
    </div>
  );
}

interface SortableBlockProps {
  blockName: string;
  blockIdx: number;
  blockCount: number;
  exercises: WorkoutTemplateExercise[];
  allExercises: Exercise[];
  blockNames: string[];
  onAddExercise: (blockName: string) => void;
  onDeleteBlock: (blockName: string) => void;
  onUpdateExercise: (id: string, patch: Partial<WorkoutTemplateExercise>) => void;
  onRemoveExercise: (id: string) => void;
}

function SortableBlock({ blockName, blockIdx, blockCount, exercises, allExercises, blockNames, onAddExercise, onDeleteBlock, onUpdateExercise, onRemoveExercise }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `block:${blockName}` });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }} className="flex flex-col gap-0">
      <div className="flex items-center gap-2 px-1 pb-2">
        <button {...listeners} {...attributes} className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-orange-400 cursor-grab active:cursor-grabbing touch-none" tabIndex={-1}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="4" cy="3" r="1.2" /><circle cx="10" cy="3" r="1.2" />
            <circle cx="4" cy="7" r="1.2" /><circle cx="10" cy="7" r="1.2" />
            <circle cx="4" cy="11" r="1.2" /><circle cx="10" cy="11" r="1.2" />
          </svg>
        </button>
        <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
        <h3 className="font-semibold text-slate-800 flex-1">{blockName}</h3>
        <span className="text-xs text-slate-400">{blockIdx + 1}/{blockCount}</span>
        <Button size="sm" variant="outline" onClick={() => onAddExercise(blockName)}>+ Add</Button>
        <button onClick={() => onDeleteBlock(blockName)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">✕</button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex flex-col gap-2">
        <SortableContext items={exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
          {exercises.map(ex => (
            <SortableExerciseCard key={ex.id} ex={ex} allExercises={allExercises} blockNames={blockNames} onUpdate={onUpdateExercise} onRemove={onRemoveExercise} />
          ))}
        </SortableContext>
        {exercises.length === 0 && (
          <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center text-sm text-slate-400">No exercises in this block.</div>
        )}
      </div>
    </div>
  );
}

export function TemplateEditor({ template, allExercises, onSaved, onCancel }: Props) {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<WorkoutTemplateExercise[]>([]);
  const [blockNames, setBlockNames] = useState<string[]>([]);
  const [pickerForBlock, setPickerForBlock] = useState<string | null | typeof PICKER_CLOSED>(PICKER_CLOSED);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (template) {
      setName(template.name);
      setObjective(template.objective ?? '');
      setNotes(template.notes ?? '');
      const exs = template.exercises ?? [];
      setExercises(exs);
      const names: string[] = [];
      for (const e of exs) {
        if (e.block_name && !names.includes(e.block_name)) names.push(e.block_name);
      }
      setBlockNames(names);
    } else {
      setName(''); setObjective(''); setNotes('');
      setExercises([]); setBlockNames([]);
    }
  }, [template]);

  function updateExercise(id: string, patch: Partial<WorkoutTemplateExercise>) {
    setExercises(exs => exs.map(e => e.id === id ? { ...e, ...patch } : e));
  }
  function removeExercise(id: string) {
    setExercises(exs => exs.filter(e => e.id !== id));
  }
  function addExercise(ex: Exercise, blockName: string | null) {
    const newEx: WorkoutTemplateExercise = {
      id: `temp-${Date.now()}`,
      template_id: template?.id ?? '',
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

  function handleDragStart(event: DragStartEvent) { setActiveId(event.active.id as string); }
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    if (activeIdStr.startsWith('block:') && overIdStr.startsWith('block:')) {
      const activeBlock = activeIdStr.slice(6);
      const overBlock = overIdStr.slice(6);
      setBlockNames(names => arrayMove(names, names.indexOf(activeBlock), names.indexOf(overBlock)));
      return;
    }
    setExercises(prev => {
      const activeEx = prev.find(e => e.id === activeIdStr);
      const overEx = prev.find(e => e.id === overIdStr);
      if (!activeEx || !overEx || activeEx.block_name !== overEx.block_name) return prev;
      return arrayMove(prev, prev.findIndex(e => e.id === activeIdStr), prev.findIndex(e => e.id === overIdStr));
    });
  }

  async function save() {
    if (!name.trim()) { toast('Template name is required', 'error'); return; }
    setSaving(true);
    try {
      const ungrouped = exercises.filter(e => !e.block_name);
      const grouped = blockNames.flatMap(bn => exercises.filter(e => e.block_name === bn));
      const ordered = [...ungrouped, ...grouped];
      const body = {
        name: name.trim(),
        objective: objective || null,
        notes: notes || null,
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

      let result: WorkoutTemplate;
      if (template) {
        const res = await fetch(`/api/workout-templates/${template.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        result = await res.json();
      } else {
        const res = await fetch('/api/workout-templates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        result = await res.json();
      }
      toast('Template saved!');
      onSaved(result);
    } catch {
      toast('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  }

  const ungroupedExercises = exercises.filter(e => !e.block_name);
  const blockDndIds = blockNames.map(bn => `block:${bn}`);
  const activeExercise = activeId && !activeId.startsWith('block:') ? exercises.find(e => e.id === activeId) : null;

  const muscleGroupCounts = exercises.reduce<Record<string, number>>((acc, ex) => {
    const exercise = ex.exercise ?? allExercises.find(e => e.id === ex.exercise_id);
    for (const mg of exercise?.muscle_groups ?? []) { acc[mg] = (acc[mg] ?? 0) + 1; }
    return acc;
  }, {});
  const muscleGroupEntries = Object.entries(muscleGroupCounts).sort((a, b) => b[1] - a[1]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-col gap-3">
            <Input label="Template name" placeholder="e.g. Push Day A" value={name} onChange={e => setName(e.target.value)} autoFocus />
            <Textarea label="Objective" placeholder="Goals for this workout..." value={objective} rows={2} onChange={e => setObjective(e.target.value)} />
            <Textarea label="Notes" placeholder="Any notes..." value={notes} rows={2} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{blockNames.length > 0 ? 'Ungrouped' : 'Exercises'}</h3>
            <Button size="sm" variant="outline" onClick={() => setPickerForBlock(null)}>+ Add exercise</Button>
          </div>
          <SortableContext items={ungroupedExercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
            {ungroupedExercises.map(ex => (
              <SortableExerciseCard key={ex.id} ex={ex} allExercises={allExercises} blockNames={blockNames} onUpdate={updateExercise} onRemove={removeExercise} />
            ))}
          </SortableContext>
          {ungroupedExercises.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">No exercises yet. Add one above.</div>
          )}
        </div>

        <SortableContext items={blockDndIds} strategy={verticalListSortingStrategy}>
          {blockNames.map((blockName, blockIdx) => (
            <SortableBlock
              key={blockName}
              blockName={blockName}
              blockIdx={blockIdx}
              blockCount={blockNames.length}
              exercises={exercises.filter(e => e.block_name === blockName)}
              allExercises={allExercises}
              blockNames={blockNames}
              onAddExercise={bn => setPickerForBlock(bn)}
              onDeleteBlock={deleteBlock}
              onUpdateExercise={updateExercise}
              onRemoveExercise={removeExercise}
            />
          ))}
        </SortableContext>

        {showAddBlock ? (
          <div className="flex gap-2 items-end">
            <Input label="Block name" placeholder="e.g. Warm-up, Strength, Accessory" value={newBlockName} onChange={e => setNewBlockName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addBlock(); if (e.key === 'Escape') { setShowAddBlock(false); setNewBlockName(''); } }}
              autoFocus className="flex-1"
            />
            <Button size="sm" onClick={addBlock} disabled={!newBlockName.trim()}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowAddBlock(false); setNewBlockName(''); }}>Cancel</Button>
          </div>
        ) : (
          <button onClick={() => setShowAddBlock(true)} className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-orange-600 border border-dashed border-slate-300 hover:border-orange-300 rounded-2xl px-4 py-3 transition-colors">
            <span className="text-base leading-none font-medium">+</span>
            Add block
          </button>
        )}

        {muscleGroupEntries.length > 0 && (
          <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4">
            <h3 className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Muscle groups</h3>
            <div className="flex flex-wrap gap-2">
              {muscleGroupEntries.map(([mg, count]) => (
                <div key={mg} className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 border border-orange-100 text-sm">
                  <span className="text-slate-700">{mg}</span>
                  <span className="font-semibold text-xs bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button onClick={save} loading={saving} className="flex-1">Save Template</Button>
        </div>
      </div>

      {pickerForBlock !== PICKER_CLOSED && (
        <ExercisePicker exercises={allExercises} onSelect={ex => addExercise(ex, pickerForBlock)} onClose={() => setPickerForBlock(PICKER_CLOSED)} />
      )}

      <DragOverlay>
        {activeExercise && (
          <div className="rotate-1 shadow-xl opacity-95">
            <ExerciseCardContent ex={activeExercise} allExercises={allExercises} blockNames={blockNames} onUpdate={() => {}} onRemove={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
