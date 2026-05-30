'use client';
import Link from 'next/link';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { WorkoutPlan, WorkoutSession } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface Props {
  plans: WorkoutPlan[];
  sessions: WorkoutSession[];
}

export function SummaryCards({ plans, sessions }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const nextPlan = plans.find(p => p.date >= today);
  const lastSession = [...sessions]
    .filter(s => s.date < today && s.status === 'done')
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  const totalDone = sessions.filter(s => s.status === 'done').length;
  const streak = computeStreak(sessions);
  const adherence = computeAdherence(plans, sessions);

  return (
    <div className="flex flex-col gap-3">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Workouts" value={totalDone} color="text-green-600" />
        <StatCard label="Streak" value={`${streak}🔥`} color="text-orange-500" />
        <StatCard label="Adherence" value={`${adherence}%`} color={adherence >= 80 ? 'text-green-600' : adherence >= 50 ? 'text-yellow-500' : 'text-red-500'} />
      </div>

      {/* Next workout */}
      {nextPlan && (
        <Link href={`/workout/${nextPlan.date}`} className="block">
          <div className="bg-orange-500 text-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-medium text-orange-100 mb-1">
              {nextPlan.date === today ? 'Today' : format(parseISO(nextPlan.date), 'EEEE, MMM d')}
            </p>
            <p className="font-semibold text-lg">{nextPlan.name ?? 'Workout'}</p>
            {nextPlan.objective && (
              <p className="text-sm text-orange-100 mt-1 line-clamp-2">{nextPlan.objective}</p>
            )}
            <div className="mt-3 flex items-center gap-1 text-sm text-orange-100">
              <span>Open workout</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </Link>
      )}

      {/* Last session */}
      {lastSession && (
        <Link href={`/workout/${lastSession.date}`} className="block">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-slate-400">Last workout</p>
              <Badge color="green">Done</Badge>
            </div>
            <p className="font-medium text-slate-800">
              {format(parseISO(lastSession.date), 'EEEE, MMM d')}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatDistanceToNow(parseISO(lastSession.date), { addSuffix: true })}
            </p>
          </div>
        </Link>
      )}

      {!nextPlan && !lastSession && (
        <div className="bg-white rounded-2xl p-6 border border-dashed border-slate-200 text-center">
          <p className="text-slate-400 text-sm">No workouts yet.</p>
          <Link href="/planner" className="text-orange-500 text-sm font-medium mt-1 inline-block">
            Plan your first workout →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function computeAdherence(plans: WorkoutPlan[], sessions: WorkoutSession[]) {
  const cutoff = format(new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  const plannedDates = plans.filter(p => p.date >= cutoff && p.date <= today).map(p => p.date);
  if (!plannedDates.length) return 0;
  const doneDates = new Set(sessions.filter(s => s.status === 'done').map(s => s.date));
  const done = plannedDates.filter(d => doneDates.has(d)).length;
  return Math.round((done / plannedDates.length) * 100);
}

function computeStreak(sessions: WorkoutSession[]) {
  const done = sessions
    .filter(s => s.status === 'done')
    .map(s => s.date)
    .sort()
    .reverse();

  if (!done.length) return 0;

  const today = format(new Date(), 'yyyy-MM-dd');
  let streak = 0;
  let current = today;

  for (const date of done) {
    if (date === current) {
      streak++;
      const d = parseISO(current);
      d.setDate(d.getDate() - 1);
      current = format(d, 'yyyy-MM-dd');
    } else if (date < current) {
      break;
    }
  }
  return streak;
}
