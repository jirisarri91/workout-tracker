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
  planNotes?: string | null;
  onSessionUpdated: () => void;
}

function toTimeInput(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'HH:mm');
  } catch {
    return '';
  }
}

function applyTimeToDate(dateStr: string, timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const d = parseISO(dateStr);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function WorkoutHeader({ date, session, planObjective, planName, planNotes, onSessionUpdated }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState(session?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDeleteSession, setConfirmDeleteSession] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);
  const [editingStart, setEditingStart] = useState(false);
  const [editingEnd, setEditingEnd] = useState(false);
  const [startTimeVal, setStartTimeVal] = useState(toTimeInput(session?.actual_start_time));
  const [endTimeVal, setEndTimeVal] = useState(toTimeInput(session?.actual_end_time));
  const { toast } = useToast();
  const notesTimeout = { current: null as ReturnType<typeof setTimeout> | null };

  useEffect(() => {
    setNotes(session?.notes ?? '');
    setStartTimeVal(toTimeInput(session?.actual_start_time));
    setEndTimeVal(toTimeInput(session?.actual_end_time));
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
      toast('¡Entreno iniciado!');
    } catch { toast('Error al iniciar', 'error'); }
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
      toast('¡Entreno completo! 💪');
    } catch { toast('Error al finalizar', 'error'); }
    finally { setSaving(false); }
  }

  async function saveStartTime(val: string) {
    if (!session || !val) return;
    try {
      await fetch(`/api/workout-sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual_start_time: applyTimeToDate(date, val) }),
      });
      onSessionUpdated();
    } catch { toast('Error al guardar hora', 'error'); }
  }

  async function saveEndTime(val: string) {
    if (!session || !val) return;
    try {
      await fetch(`/api/workout-sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual_end_time: applyTimeToDate(date, val) }),
      });
      onSessionUpdated();
    } catch { toast('Error al guardar hora', 'error'); }
  }

  async function deleteSession() {
    if (!session) return;
    setDeletingSession(true);
    try {
      await fetch(`/api/workout-sessions/${session.id}`, { method: 'DELETE' });
      setConfirmDeleteSession(false);
      setRunning(false);
      onSessionUpdated();
      toast('Sesión eliminada');
    } catch { toast('Error al eliminar', 'error'); }
    finally { setDeletingSession(false); }
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
          <h1 className="text-lg font-bold text-slate-900 mt-0.5 truncate">{planName ?? 'Entreno'}</h1>
          {planObjective && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{planObjective}</p>
          )}
          {planNotes && (
            <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">{planNotes}</p>
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
              ▶ Iniciar
            </Button>
          )}
          {started && !finished && (
            <Button size="sm" variant="danger" loading={saving} onClick={stopSession}>
              ■ Finalizar
            </Button>
          )}
          {finished && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              ✓ Listo
            </span>
          )}
        </div>
      </div>

      {/* Editable start/end times */}
      {session && (started || finished) && (
        <div className="mt-3 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Inicio:</span>
            {editingStart ? (
              <input
                type="time"
                value={startTimeVal}
                autoFocus
                className="border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-300"
                onChange={e => setStartTimeVal(e.target.value)}
                onBlur={e => { saveStartTime(e.target.value); setEditingStart(false); }}
                onKeyDown={e => { if (e.key === 'Enter') { saveStartTime(startTimeVal); setEditingStart(false); } if (e.key === 'Escape') setEditingStart(false); }}
              />
            ) : (
              <button
                onClick={() => setEditingStart(true)}
                className="font-medium text-slate-600 hover:text-orange-500 underline-offset-2 hover:underline transition-colors"
              >
                {startTimeVal || '—'}
              </button>
            )}
          </div>
          {finished && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Fin:</span>
              {editingEnd ? (
                <input
                  type="time"
                  value={endTimeVal}
                  autoFocus
                  className="border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-300"
                  onChange={e => setEndTimeVal(e.target.value)}
                  onBlur={e => { saveEndTime(e.target.value); setEditingEnd(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') { saveEndTime(endTimeVal); setEditingEnd(false); } if (e.key === 'Escape') setEditingEnd(false); }}
                />
              ) : (
                <button
                  onClick={() => setEditingEnd(true)}
                  className="font-medium text-slate-600 hover:text-orange-500 underline-offset-2 hover:underline transition-colors"
                >
                  {endTimeVal || '—'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Session notes */}
      <div className="mt-3">
        <Textarea
          placeholder="Notas de la sesión..."
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

      {session && (
        <div className="mt-2 flex justify-end">
          {confirmDeleteSession ? (
            <div className="flex items-center gap-2">
              <button
                onClick={deleteSession}
                disabled={deletingSession}
                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-40"
              >
                {deletingSession ? 'Eliminando…' : 'Confirmar eliminación'}
              </button>
              <button
                onClick={() => setConfirmDeleteSession(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteSession(true)}
              className="text-xs text-slate-300 hover:text-red-400 transition-colors"
            >
              Eliminar sesión
            </button>
          )}
        </div>
      )}
    </div>
  );
}
