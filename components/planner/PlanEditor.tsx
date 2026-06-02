'use client';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
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

const PICKER_CLOSED = '__closed__' as const;

// Drag handle icon
function DragHandle({ listeners, attributes }: { listeners: DraggableSyntheticListeners; attributes: DraggableAttributes }) {
  return (
    <button
      {...listeners}
      {...attributes}
      className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none"
      tabIndex={-1}
      aria-label="Arrastrar para reordenar"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <circle cx="4" cy="3" r="1.2" />
        <circle cx="10" cy="3" r="1.2" />
        <circle cx="4" cy="7" r="1.2" />
        <circle cx="10" cy="7" r="1.2" />
        <circle cx="4" cy="11" r="1.2" />
        <circle cx="10" cy="11" r="1.2" />
      </svg>
    </button>
  );
}

interface ExerciseCardProps {
  ex: WorkoutPlanExercise;
  blockName: string | null;
  allExercises: Exercise[];
  blockNames: string[];
  onUpdate: (id: string, patch: Partial<WorkoutPlanExercise>) => void;
  onRemove: (id: string) => void;
  overlay?: boolean;
  isExpanded?: boolean;
  onToggle?: (id: string) => void;
}

function SortableExerciseCard({ ex, blockName, allExercises, blockNames, onUpdate, onRemove, isExpanded, onToggle }: ExerciseCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ExerciseCardContent
        ex={ex}
        blockName={blockName}
        allExercises={allExercises}
        blockNames={blockNames}
        onUpdate={onUpdate}
        onRemove={onRemove}
        dragHandle={<DragHandle listeners={listeners} attributes={attributes} />}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
    </div>
  );
}

function ExerciseCardContent({
  ex,
  blockName: _blockName,
  allExercises,
  blockNames,
  onUpdate,
  onRemove,
  dragHandle,
  isExpanded,
  onToggle,
}: ExerciseCardProps & { dragHandle?: React.ReactNode }) {
  const exercise = ex.exercise ?? allExercises.find(e => e.id === ex.exercise_id);

  if (!isExpanded) {
    const summary = [
      ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : null,
      ex.target_weight ? `${ex.target_weight}kg` : null,
    ].filter(Boolean).join(' · ');

    return (
      <div
        className="bg-white rounded-xl border border-slate-100 shadow-sm px-3 py-2.5 flex items-center gap-1 cursor-pointer hover:border-orange-200 transition-colors"
        onClick={() => onToggle?.(ex.id)}
      >
        {dragHandle}
        <span className="font-medium text-slate-900 text-sm flex-1 truncate">{exercise?.name ?? 'Unknown'}</span>
        {summary && <span className="text-xs text-slate-400 shrink-0">{summary}</span>}
        <button
          onClick={e => { e.stopPropagation(); onRemove(ex.id); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
        >✕</button>
        <span className="text-slate-300 text-xs">›</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4">
      <div className="flex items-center gap-1 mb-3">
        {dragHandle}
        <span className="font-medium text-slate-900 text-sm flex-1">{exercise?.name ?? 'Unknown'}</span>
        {exercise && exercise.muscle_groups?.length > 0 && (
          <Badge color="gray">{exercise.muscle_groups[0]}</Badge>
        )}
        <button
          onClick={() => onToggle?.(ex.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs"
        >∧</button>
        <button
          onClick={() => onRemove(ex.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
        >✕</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input label="Series" type="number" min="1" value={ex.sets?.toString() ?? ''} onChange={e => onUpdate(ex.id, { sets: parseInt(e.target.value) || null })} />
        <Input label="Reps" type="number" min="1" value={ex.reps?.toString() ?? ''} onChange={e => onUpdate(ex.id, { reps: parseInt(e.target.value) || null })} />
        <Input label="Peso objetivo (kg)" type="number" step="0.5" value={ex.target_weight?.toString() ?? ''} onChange={e => onUpdate(ex.id, { target_weight: parseFloat(e.target.value) || null })} />
        <Input label="Descanso (seg)" type="number" value={ex.rest_seconds?.toString() ?? ''} onChange={e => onUpdate(ex.id, { rest_seconds: parseInt(e.target.value) || null })} />
        <Input label="Duración (seg)" type="number" value={ex.duration_seconds?.toString() ?? ''} onChange={e => onUpdate(ex.id, { duration_seconds: parseInt(e.target.value) || null })} className="col-span-2" />
      </div>

      {blockNames.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <select
            value={ex.block_name ?? ''}
            onChange={e => onUpdate(ex.id, { block_name: e.target.value || null })}
            className="w-full text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Sin bloque</option>
            {blockNames.map(bn => (
              <option key={bn} value={bn}>{bn}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

interface SortableBlockProps {
  blockName: string;
  blockIdx: number;
  blockCount: number;
  exercises: WorkoutPlanExercise[];
  allExercises: Exercise[];
  blockNames: string[];
  onAddExercise: (blockName: string) => void;
  onDeleteBlock: (blockName: string) => void;
  onUpdateExercise: (id: string, patch: Partial<WorkoutPlanExercise>) => void;
  onRemoveExercise: (id: string) => void;
  expandedExId: string | null;
  onToggleEx: (id: string) => void;
}

function SortableBlock({
  blockName,
  blockIdx,
  blockCount,
  exercises,
  allExercises,
  blockNames,
  onAddExercise,
  onDeleteBlock,
  onUpdateExercise,
  onRemoveExercise,
  expandedExId,
  onToggleEx,
}: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `block:${blockName}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const exerciseIds = exercises.map(e => e.id);

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-0">
      {/* Block header */}
      <div className="flex items-center gap-2 px-1 pb-2">
        <button
          {...listeners}
          {...attributes}
          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-orange-400 cursor-grab active:cursor-grabbing touch-none"
          tabIndex={-1}
          aria-label={`Drag block ${blockName}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="4" cy="3" r="1.2" />
            <circle cx="10" cy="3" r="1.2" />
            <circle cx="4" cy="7" r="1.2" />
            <circle cx="10" cy="7" r="1.2" />
            <circle cx="4" cy="11" r="1.2" />
            <circle cx="10" cy="11" r="1.2" />
          </svg>
        </button>
        <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
        <h3 className="font-semibold text-slate-800 flex-1">{blockName}</h3>
        <span className="text-xs text-slate-400">{blockIdx + 1}/{blockCount}</span>
        <Button size="sm" variant="outline" onClick={() => onAddExercise(blockName)}>+ Agregar</Button>
        <button
          onClick={() => onDeleteBlock(blockName)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
        >✕</button>
      </div>

      {/* Block body — exercises grouped inside */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex flex-col gap-2">
        <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
          {exercises.map(ex => (
            <SortableExerciseCard
              key={ex.id}
              ex={ex}
              blockName={blockName}
              allExercises={allExercises}
              blockNames={blockNames}
              onUpdate={onUpdateExercise}
              onRemove={onRemoveExercise}
              isExpanded={expandedExId === ex.id}
              onToggle={onToggleEx}
            />
          ))}
        </SortableContext>

        {exercises.length === 0 && (
          <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center text-sm text-slate-400">
            Sin ejercicios en este bloque.
          </div>
        )}
      </div>
    </div>
  );
}

export function PlanEditor({ date, plan, allExercises, allPlans, onSaved }: Props) {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [exercises, setExercises] = useState<WorkoutPlanExercise[]>([]);
  const [blockNames, setBlockNames] = useState<string[]>([]);
  const [expandedExId, setExpandedExId] = useState<string | null>(null);
  const [metaExpanded, setMetaExpanded] = useState(!plan);
  const [pickerForBlock, setPickerForBlock] = useState<string | null | typeof PICKER_CLOSED>(PICKER_CLOSED);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
      setMetaExpanded(false);
      setExpandedExId(null);
    } else {
      setName(''); setObjective(''); setNotes('');
      setStartTime(''); setEndTime('');
      setExercises([]); setBlockNames([]);
      setMetaExpanded(true);
      setExpandedExId(null);
    }
  }, [plan, date]);

  function updateExercise(id: string, patch: Partial<WorkoutPlanExercise>) {
    setExercises(exs => exs.map(e => e.id === id ? { ...e, ...patch } : e));
  }

  function removeExercise(id: string) {
    setExercises(exs => exs.filter(e => e.id !== id));
  }

  function toggleEx(id: string) {
    setExpandedExId(prev => prev === id ? null : id);
  }

  function addExercise(ex: Exercise, blockName: string | null) {
    const newId = `temp-${Date.now()}`;
    const newEx: WorkoutPlanExercise = {
      id: newId,
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
    setExpandedExId(newId);
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

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Block reorder
    if (activeIdStr.startsWith('block:') && overIdStr.startsWith('block:')) {
      const activeBlock = activeIdStr.slice(6);
      const overBlock = overIdStr.slice(6);
      setBlockNames(names => {
        const oldIdx = names.indexOf(activeBlock);
        const newIdx = names.indexOf(overBlock);
        return arrayMove(names, oldIdx, newIdx);
      });
      return;
    }

    // Exercise reorder within same block
    setExercises(prev => {
      const activeEx = prev.find(e => e.id === activeIdStr);
      const overEx = prev.find(e => e.id === overIdStr);
      if (!activeEx || !overEx) return prev;
      if (activeEx.block_name !== overEx.block_name) return prev;

      const oldIdx = prev.findIndex(e => e.id === activeIdStr);
      const newIdx = prev.findIndex(e => e.id === overIdStr);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  async function deletePlan() {
    if (!plan) return;
    setDeleting(true);
    try {
      await fetch(`/api/workout-plans/${plan.id}`, { method: 'DELETE' });
      toast('Plan eliminado');
      setConfirmDelete(false);
      onSaved();
    } catch {
      toast('Error al eliminar el plan', 'error');
    } finally {
      setDeleting(false);
    }
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
      toast('¡Plan guardado!');
      onSaved();
    } catch {
      toast('Error al guardar el plan', 'error');
    } finally {
      setSaving(false);
    }
  }

  const displayDate = format(parseISO(date), 'EEEE, MMMM d, yyyy');
  const ungroupedExercises = exercises.filter(e => !e.block_name);
  const ungroupedIds = ungroupedExercises.map(e => e.id);
  const blockDndIds = blockNames.map(bn => `block:${bn}`);

  const activeExercise = activeId && !activeId.startsWith('block:')
    ? exercises.find(e => e.id === activeId)
    : null;

  const muscleGroupCounts = exercises.reduce<Record<string, number>>((acc, ex) => {
    const exercise = ex.exercise ?? allExercises.find(e => e.id === ex.exercise_id);
    for (const mg of exercise?.muscle_groups ?? []) {
      acc[mg] = (acc[mg] ?? 0) + 1;
    }
    return acc;
  }, {});
  const muscleGroupEntries = Object.entries(muscleGroupCounts).sort((a, b) => b[1] - a[1]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        {/* Plan metadata */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            onClick={() => setMetaExpanded(v => !v)}
          >
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 text-sm">{displayDate}</span>
              {!metaExpanded && name && (
                <span className="text-xs text-slate-500 mt-0.5">{name}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {plan && !metaExpanded && (
                <button
                  onClick={e => { e.stopPropagation(); setShowCopyModal(true); }}
                  className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copiar
                </button>
              )}
              <span className="text-slate-400 text-xs">{metaExpanded ? '∧' : '∨'}</span>
            </div>
          </button>

          {metaExpanded && (
            <div className="px-4 pb-4 flex flex-col gap-3 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{displayDate}</span>
                {plan && (
                  <button
                    onClick={() => setShowCopyModal(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copiar a días
                  </button>
                )}
              </div>
              <Input label="Nombre del entreno" placeholder="ej. Día de Empuje A" value={name} onChange={e => setName(e.target.value)} />
              <Textarea label="Objetivo" placeholder="Objetivos de esta sesión..." value={objective} rows={2} onChange={e => setObjective(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Hora inicio" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                <Input label="Hora fin" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
              <Textarea label="Notas generales" placeholder="Notas adicionales..." value={notes} rows={2} onChange={e => setNotes(e.target.value)} />
            </div>
          )}
        </div>

        {/* Ungrouped exercises */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              {blockNames.length > 0 ? 'Sin grupo' : 'Ejercicios'}
            </h3>
            <Button size="sm" variant="outline" onClick={() => setPickerForBlock(null)}>+ Agregar ejercicio</Button>
          </div>

          <SortableContext items={ungroupedIds} strategy={verticalListSortingStrategy}>
            {ungroupedExercises.map(ex => (
              <SortableExerciseCard
                key={ex.id}
                ex={ex}
                blockName={null}
                allExercises={allExercises}
                blockNames={blockNames}
                onUpdate={updateExercise}
                onRemove={removeExercise}
                isExpanded={expandedExId === ex.id}
                onToggle={toggleEx}
              />
            ))}
          </SortableContext>

          {ungroupedExercises.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
              Sin ejercicios. Agregá uno arriba.
            </div>
          )}
        </div>

        {/* Named blocks — sortable */}
        <SortableContext items={blockDndIds} strategy={verticalListSortingStrategy}>
          {blockNames.map((blockName, blockIdx) => {
            const blockExercises = exercises.filter(e => e.block_name === blockName);
            return (
              <SortableBlock
                key={blockName}
                blockName={blockName}
                blockIdx={blockIdx}
                blockCount={blockNames.length}
                exercises={blockExercises}
                allExercises={allExercises}
                blockNames={blockNames}
                onAddExercise={bn => setPickerForBlock(bn)}
                onDeleteBlock={deleteBlock}
                onUpdateExercise={updateExercise}
                onRemoveExercise={removeExercise}
                expandedExId={expandedExId}
                onToggleEx={toggleEx}
              />
            );
          })}
        </SortableContext>

        {/* Add block */}
        {showAddBlock ? (
          <div className="flex gap-2 items-end">
            <Input
              label="Nombre del bloque"
              placeholder="ej. Calentamiento, Fuerza, Accesorios"
              value={newBlockName}
              onChange={e => setNewBlockName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addBlock();
                if (e.key === 'Escape') { setShowAddBlock(false); setNewBlockName(''); }
              }}
              autoFocus
              className="flex-1"
            />
            <Button size="sm" onClick={addBlock} disabled={!newBlockName.trim()}>Agregar</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowAddBlock(false); setNewBlockName(''); }}>Cancelar</Button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddBlock(true)}
            className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-orange-600 border border-dashed border-slate-300 hover:border-orange-300 rounded-2xl px-4 py-3 transition-colors"
          >
            <span className="text-base leading-none font-medium">+</span>
            Agregar bloque
          </button>
        )}

        {muscleGroupEntries.length > 0 && (
          <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4">
            <h3 className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Grupos musculares esta sesión</h3>
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

        <Button onClick={save} loading={saving} size="lg" className="w-full">
          Guardar Plan
        </Button>

        {plan && (
          confirmDelete ? (
            <div className="flex items-center gap-2 justify-center">
              <Button
                size="sm"
                variant="danger"
                loading={deleting}
                onClick={deletePlan}
              >
                Confirmar eliminación
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-slate-400 hover:text-red-500 transition-colors text-center w-full py-1"
            >
              Eliminar este plan
            </button>
          )
        )}

        {/* Drag overlay — shows floating card while dragging an exercise */}
        <DragOverlay>
          {activeExercise && (
            <div className="rotate-1 shadow-xl opacity-95">
              <ExerciseCardContent
                ex={activeExercise}
                blockName={activeExercise.block_name}
                allExercises={allExercises}
                blockNames={blockNames}
                onUpdate={() => {}}
                onRemove={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </div>

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
    </DndContext>
  );
}
