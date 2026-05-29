'use client';
import { useState } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  getDay, addMonths, subMonths, isToday, parseISO,
} from 'date-fns';
import { WorkoutPlan } from '@/types';

interface Props {
  plans: WorkoutPlan[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function PlannerDatePicker({ plans, selectedDate, onSelect }: Props) {
  const [viewDate, setViewDate] = useState(new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  function hasPlan(date: string) {
    return plans.some(p => p.date === date);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
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
          const today = isToday(day);
          const planned = hasPlan(dateStr);
          const selected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={`flex flex-col items-center justify-center aspect-square rounded-lg text-sm font-medium transition-colors
                ${selected ? 'bg-orange-500 text-white' : today ? 'ring-2 ring-orange-300 text-orange-600' : 'text-slate-700 hover:bg-slate-100'}
              `}
            >
              {format(day, 'd')}
              {planned && !selected && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
