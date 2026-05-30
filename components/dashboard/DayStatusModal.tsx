'use client';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DayStatus, WorkoutSession } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

interface Props {
  date: string;
  session?: WorkoutSession;
  hasPlan: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS: { value: DayStatus; label: string; color: string; emoji: string }[] = [
  { value: 'done', label: 'Workout Done', color: 'border-green-400 bg-green-50 text-green-700', emoji: '✅' },
  { value: 'skipped', label: 'Skipped', color: 'border-red-300 bg-red-50 text-red-600', emoji: '❌' },
  { value: 'planned', label: 'Planned', color: 'border-slate-300 bg-slate-50 text-slate-600', emoji: '📋' },
  { value: 'sport', label: 'Played Sport', color: 'border-blue-300 bg-blue-50 text-blue-600', emoji: '⚽' },
  { value: 'swim', label: 'Swim', color: 'border-cyan-300 bg-cyan-50 text-cyan-600', emoji: '🏊' },
  { value: 'walk', label: 'Walk', color: 'border-teal-300 bg-teal-50 text-teal-600', emoji: '🚶' },
  { value: 'row', label: 'Row', color: 'border-indigo-300 bg-indigo-50 text-indigo-600', emoji: '🚣' },
];

export function DayStatusModal({ date, session, hasPlan, onClose, onSaved }: Props) {
  const [status, setStatus] = useState<DayStatus>(session?.status ?? (hasPlan ? 'planned' : 'done'));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function save() {
    setSaving(true);
    try {
      if (session) {
        await fetch(`/api/workout-sessions/${session.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
      } else {
        await fetch('/api/workout-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, status }),
        });
      }
      toast('Day updated');
      onSaved();
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  const displayDate = format(parseISO(date), 'EEEE, MMMM d');

  return (
    <Modal open onClose={onClose} title={displayDate}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">Set the activity for this day:</p>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left
                ${status === opt.value ? opt.color : 'border-slate-200 text-slate-600 hover:border-slate-300'}
              `}
            >
              <span className="text-lg">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={saving} onClick={save}>Save</Button>
        </div>

        {(hasPlan || session) && (
          <Link
            href={`/workout/${date}`}
            className="text-center text-sm text-orange-500 font-medium hover:underline"
            onClick={onClose}
          >
            Open workout for this day →
          </Link>
        )}
      </div>
    </Modal>
  );
}
