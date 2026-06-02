'use client';
import { useState } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  getDay, addMonths, subMonths, isSameDay, isToday, parseISO,
} from 'date-fns';
import { DayStatus, WorkoutSession, WorkoutPlan } from '@/types';
import { DayStatusModal } from './DayStatusModal';

interface Props {
  sessions: WorkoutSession[];
  plans: WorkoutPlan[];
  onSessionChange: () => void;
}

const STATUS_DOT: Record<DayStatus, string> = {
  done: 'bg-green-500',
  skipped: 'bg-red-400',
  sport: 'bg-blue-400',
  swim: 'bg-cyan-400',
  walk: 'bg-teal-400',
  row: 'bg-indigo-400',
  planned: 'bg-slate-300',
};

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

export function WorkoutCalendar({ sessions, plans, onSessionChange }: Props) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  function getSession(day: Date) {
    return sessions.find(s => s.date === format(day, 'yyyy-MM-dd'));
  }

  function hasPlan(day: Date) {
    return plans.some(p => p.date === format(day, 'yyyy-MM-dd'));
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <button
          onClick={() => setViewDate(d => subMonths(d, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="font-semibold text-slate-800">
          {format(viewDate, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setViewDate(d => addMonths(d, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 px-2 pb-3 gap-y-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const session = getSession(day);
          const planned = hasPlan(day);
          const dateStr = format(day, 'yyyy-MM-dd');
          const today = isToday(day);
          const status = session?.status;
          const dotClass = status ? STATUS_DOT[status] : (planned ? STATUS_DOT.planned : null);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex flex-col items-center justify-center aspect-square rounded-lg text-sm font-medium transition-colors
                ${today ? 'ring-2 ring-orange-400' : ''}
                ${selectedDate === dateStr ? 'bg-orange-50' : 'hover:bg-slate-50'}
                ${status === 'done' ? 'text-green-700' : status === 'skipped' ? 'text-red-600' : today ? 'text-orange-600' : 'text-slate-700'}
              `}
            >
              {format(day, 'd')}
              {dotClass ? (
                <span className={`w-1.5 h-1.5 rounded-full ${dotClass} mt-0.5`} />
              ) : (
                <span className="w-1.5 h-1.5 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-4 pb-3 text-xs text-slate-500">
        {([
          ['done', 'Listo'],
          ['skipped', 'Omitido'],
          ['planned', 'Planificado'],
          ['sport', 'Deporte'],
        ] as [DayStatus, string][]).map(([s, label]) => (
          <span key={s} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          Nado/Caminata/Remo
        </span>
      </div>

      {selectedDate && (
        <DayStatusModal
          date={selectedDate}
          session={sessions.find(s => s.date === selectedDate)}
          hasPlan={plans.some(p => p.date === selectedDate)}
          onClose={() => setSelectedDate(null)}
          onSaved={() => { setSelectedDate(null); onSessionChange(); }}
        />
      )}
    </div>
  );
}
