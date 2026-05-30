'use client';
import { useState } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  getDay, addMonths, subMonths, isToday, isBefore, startOfDay,
} from 'date-fns';
import { WorkoutPlan } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface Props {
  plan: WorkoutPlan;
  existingPlans: WorkoutPlan[];
  onClose: () => void;
  onCopied: () => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CopyPlanModal({ plan, existingPlans, onClose, onCopied }: Props) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const today = startOfDay(new Date());

  const existingDates = new Set(existingPlans.map(p => p.date));

  function toggleDate(dateStr: string) {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }

  async function handleCopy() {
    if (selectedDates.size === 0) return;
    setCopying(true);
    try {
      const res = await fetch('/api/workout-plans/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_plan_id: plan.id, dates: Array.from(selectedDates) }),
      });
      if (!res.ok) throw new Error();
      const results: { date: string; status: string }[] = await res.json();
      const created = results.filter(r => r.status === 'created').length;
      const skipped = results.filter(r => r.status === 'skipped').length;
      let msg = `Copied to ${created} day${created !== 1 ? 's' : ''}`;
      if (skipped > 0) msg += ` (${skipped} skipped — already had a plan)`;
      toast(msg);
      onCopied();
      onClose();
    } catch {
      toast('Failed to copy plan', 'error');
    } finally {
      setCopying(false);
    }
  }

  return (
    <Modal open onClose={onClose}>
      <div className="flex flex-col gap-4 p-1">
        <div>
          <h2 className="font-semibold text-slate-900 text-lg">Copy workout</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Select the days you want to copy <span className="font-medium text-slate-700">{plan.name || 'this workout'}</span> to.
          </p>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <button
              onClick={() => setViewDate(d => subMonths(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="font-semibold text-slate-800">{format(viewDate, 'MMMM yyyy')}</span>
            <button
              onClick={() => setViewDate(d => addMonths(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 px-2 pt-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 px-2 pb-3 gap-y-1">
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isPast = isBefore(startOfDay(day), today);
              const isSource = plan.date === dateStr;
              const hasExisting = existingDates.has(dateStr);
              const isSelected = selectedDates.has(dateStr);
              const todayDate = isToday(day);

              return (
                <button
                  key={dateStr}
                  onClick={() => !isPast && !isSource && toggleDate(dateStr)}
                  disabled={isPast || isSource}
                  className={`flex flex-col items-center justify-center aspect-square rounded-lg text-sm font-medium transition-colors
                    ${isSelected ? 'bg-orange-500 text-white' :
                      isSource ? 'bg-slate-100 text-slate-400 cursor-default' :
                      isPast ? 'text-slate-300 cursor-default' :
                      todayDate ? 'ring-2 ring-orange-300 text-orange-600 hover:bg-orange-50' :
                      'text-slate-700 hover:bg-slate-100'}
                  `}
                >
                  {format(day, 'd')}
                  {hasExisting && !isSelected && !isSource && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-0.5" />
                  )}
                  {isSource && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
            Already has a plan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
            Source workout
          </span>
        </div>

        {selectedDates.size > 0 && (
          <p className="text-sm font-medium text-orange-600">
            {selectedDates.size} day{selectedDates.size !== 1 ? 's' : ''} selected
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={copying}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleCopy}
            loading={copying}
            disabled={selectedDates.size === 0}
          >
            Copy to {selectedDates.size > 0 ? `${selectedDates.size} day${selectedDates.size !== 1 ? 's' : ''}` : 'days'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
