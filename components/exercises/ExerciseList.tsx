'use client';
import { useState } from 'react';
import { Exercise } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ExerciseForm } from './ExerciseForm';
import { ExerciseInstructions } from '@/components/workout/ExerciseInstructions';
import { useToast } from '@/components/ui/Toast';

interface Props {
  exercises: Exercise[];
  onChanged: () => void;
}

export function ExerciseList({ exercises, onChanged }: Props) {
  const [editTarget, setEditTarget] = useState<Exercise | null | 'new'>('new');
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const allMuscleGroups = Array.from(
    new Set(exercises.flatMap(e => e.muscle_groups ?? []))
  ).sort();

  function toggleGroup(group: string) {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }

  const filtered = exercises.filter(e => {
    const matchesQuery =
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.muscle_groups?.some(m => m.toLowerCase().includes(query.toLowerCase()));
    const matchesGroups =
      selectedGroups.size === 0 ||
      e.muscle_groups?.some(m => selectedGroups.has(m));
    return matchesQuery && matchesGroups;
  });

  async function deleteExercise(ex: Exercise) {
    if (!confirm(`Delete "${ex.name}"? This cannot be undone.`)) return;
    setDeleting(ex.id);
    try {
      const res = await fetch(`/api/exercises/${ex.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to delete');
      }
      toast('Exercise deleted');
      onChanged();
    } catch (e: any) { toast(e.message || 'Failed to delete', 'error'); }
    finally { setDeleting(null); }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search + add */}
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Search exercises..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <Button
          size="md"
          onClick={() => { setEditTarget(null); setShowForm(true); }}
        >
          + New
        </Button>
      </div>

      {/* Muscle group filters */}
      {allMuscleGroups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allMuscleGroups.map(group => {
            const active = selectedGroups.has(group);
            return (
              <button
                key={group}
                onClick={() => toggleGroup(group)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                {group}
              </button>
            );
          })}
          {selectedGroups.size > 0 && (
            <button
              onClick={() => setSelectedGroups(new Set())}
              className="px-3 py-1 rounded-full text-xs font-medium border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* List */}
      {filtered.map(ex => (
        <div key={ex.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900">{ex.name}</span>
                <ExerciseInstructions exercise={ex} />
              </div>
              {ex.muscle_groups?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {ex.muscle_groups.map(m => <Badge key={m} color="gray">{m}</Badge>)}
                </div>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => { setEditTarget(ex); setShowForm(true); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => deleteExercise(ex)}
                disabled={deleting === ex.id}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-center text-slate-400 py-10 text-sm">No exercises found</p>
      )}

      {showForm && (
        <ExerciseForm
          exercise={editTarget && editTarget !== 'new' ? editTarget : null}
          allMuscleGroups={allMuscleGroups}
          onSaved={onChanged}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
