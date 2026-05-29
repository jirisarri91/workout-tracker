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
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    e.muscle_groups?.some(m => m.toLowerCase().includes(query.toLowerCase()))
  );

  async function deleteExercise(ex: Exercise) {
    if (!confirm(`Delete "${ex.name}"? This cannot be undone.`)) return;
    setDeleting(ex.id);
    try {
      await fetch(`/api/exercises/${ex.id}`, { method: 'DELETE' });
      toast('Exercise deleted');
      onChanged();
    } catch { toast('Failed to delete', 'error'); }
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
          onSaved={onChanged}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
