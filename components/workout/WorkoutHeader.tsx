'use client';
import { useState, useEffect } from 'react';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { WorkoutSession } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface Props {
  date: string;
  session: WorkoutSession | null | undefined;
  planObjective?: string | null;
  planName?: string | null;
  onSessionUpdated: () => void;
}

export function WorkoutHeader({ date, session, planObjective, planName, onSessionUpdated }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState(session?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const notesTimeout = { current: null as ReturnType<typeof setTimeout> | null };

  useEffect(() => {
    setNotes(session?.notes ?? '');
    if (session?.actual_start_time && !session.actual_end_time) {
      setRunning(true);
      const start = parseISO(session.actual_start_time);
      setElapsed(differenceInSeconds(new Date(), start));
    }
  }, [session]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  function formatTime(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  async function startSession() {
    setSaving(true);
    try {
      const body = { date, status: 'done' as const, actual_start_time: new Date().toISOString() };
      if (session) {
        await fetch(`/api/workout-sessions/${session.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/workout-sessions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      }
      setRunning(true);
      onSessionUpdated();
      toast('Workout started!');
    } catch { toast('Failed to start', 'error'); }
    finally { setSaving(false); }
  }

  async function stopSession() {
    if (!session) return;
    setSaving(true);
    try {
      await fetch(`/api/workout-sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual_end_time: new Date().toISOString() }),
      });
      setRunning(false);
      onSessionUpdated();
      toast('Workout complete! 💪');
    } catch { toast('Failed to stop', 'error'); }
    finally { setSaving(false); }
  }

  async function saveNotes(val: string) {
    if (!session) return;
    try {
      await fetch(`/api/workout-sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: val }),
      });
    } catch { /* silent */ }
  }

  const displayDate = format(parseISO(date), 'EEEE, MMMM d');
  const started = !!session?.actual_start_time;
  const finished = !!session?.actual_end_time;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{displayDate}</p>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5 truncate">{planName ?? 'Workout'}</h1>
          {planObjective && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{planObjective}</p>
          )}
        </div>

        {/* Timer */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {started && (
            <div className={`text-2xl font-mono font-bold tabular-nums ${running ? 'text-orange-500' : 'text-slate-700'}`}>
              {formatTime(elapsed)}
            </div>
          )}
          {!started && (
            <Button size="sm" loading={saving} onClick={startSession}>
              ▶ Start
            </Button>
          )}
          {started && !finished && (
            <Button size="sm" variant="danger" loading={saving} onClick={stopSession}>
              ■ Finish
            </Button>
          )}
          {finished && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              ✓ Done
            </span>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-3">
        <Textarea
          placeholder="Session notes..."
          value={notes}
          rows={2}
          className="text-sm"
          onChange={e => {
            setNotes(e.target.value);
            if (notesTimeout.current) clearTimeout(notesTimeout.current);
            notesTimeout.current = setTimeout(() => saveNotes(e.target.value), 800);
          }}
        />
      </div>
    </div>
  );
}
