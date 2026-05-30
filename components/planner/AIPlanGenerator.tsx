'use client';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useExercises } from '@/hooks/useExercises';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface GeneratedExercise {
  exercise_id: string;
  sets: number;
  reps: number;
  target_weight: number | null;
  rest_seconds: number;
  notes: string;
}

interface GeneratedPlan {
  name: string;
  objective: string;
  exercises: GeneratedExercise[];
}

interface Props {
  date: string;
  onPlanCreated: () => void;
}

export function AIPlanGenerator({ date, onPlanCreated }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [intent, setIntent] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<GeneratedPlan | null>(null);
  const [applying, setApplying] = useState(false);
  const { exercises } = useExercises();
  const { toast } = useToast();

  async function generate() {
    if (!intent.trim()) return;
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, intent }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreview(data);
    } catch (e) {
      toast('Failed to generate plan', 'error');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function applyPlan() {
    if (!preview) return;
    setApplying(true);
    try {
      const existingRes = await fetch(`/api/workout-plans?date=${date}`);
      const existing = await existingRes.json();

      const body = {
        date,
        name: preview.name,
        objective: preview.objective,
        exercises: preview.exercises,
      };

      if (existing?.id) {
        await fetch(`/api/workout-plans/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: preview.name, objective: preview.objective, exercises: preview.exercises }),
        });
      } else {
        await fetch('/api/workout-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      onPlanCreated();
      setShowModal(false);
      setPreview(null);
      setIntent('');
      toast('Plan created!', 'success');
    } catch {
      toast('Failed to apply plan', 'error');
    } finally {
      setApplying(false);
    }
  }

  function exerciseName(id: string) {
    return exercises.find(e => e.id === id)?.name ?? id;
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
        ✨ AI Plan
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Generate Plan for {format(parseISO(date), 'MMM d')}</h2>
              <button onClick={() => { setShowModal(false); setPreview(null); }} className="text-slate-400 hover:text-slate-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {!preview ? (
              <>
                <Textarea
                  label="What kind of workout?"
                  placeholder="e.g. Upper body push, focus on chest and shoulders, ~45 minutes..."
                  rows={3}
                  value={intent}
                  onChange={e => setIntent(e.target.value)}
                />
                <Button onClick={generate} loading={loading} disabled={!intent.trim()}>
                  Generate with AI
                </Button>
              </>
            ) : (
              <>
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="font-semibold text-slate-800">{preview.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{preview.objective}</p>
                </div>

                <div className="flex flex-col gap-2">
                  {preview.exercises.map((ex, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-slate-400 text-xs mt-1 w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{exerciseName(ex.exercise_id)}</p>
                        <p className="text-slate-500 text-xs">
                          {ex.sets}×{ex.reps}{ex.target_weight ? ` @ ${ex.target_weight}kg` : ''}{ex.rest_seconds ? ` · ${ex.rest_seconds}s rest` : ''}
                        </p>
                        {ex.notes && <p className="text-slate-400 text-xs mt-0.5">{ex.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button onClick={applyPlan} loading={applying}>Apply Plan</Button>
                  <Button variant="ghost" onClick={() => setPreview(null)}>Regenerate</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
