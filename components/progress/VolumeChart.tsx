'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WorkoutSession } from '@/types';
import { format, startOfWeek, parseISO } from 'date-fns';

interface Props {
  sessions: WorkoutSession[];
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#f97316',
  back: '#3b82f6',
  legs: '#22c55e',
  shoulders: '#a855f7',
  arms: '#eab308',
  core: '#06b6d4',
  other: '#94a3b8',
};

function colorFor(group: string) {
  const key = group.toLowerCase();
  return MUSCLE_COLORS[key] ?? MUSCLE_COLORS.other;
}

export function VolumeChart({ sessions }: Props) {
  const weekMap: Record<string, Record<string, number>> = {};
  const muscleGroups = new Set<string>();

  for (const session of sessions) {
    if (!session.exercises) continue;
    const week = format(startOfWeek(parseISO(session.date), { weekStartsOn: 1 }), 'MMM d');
    if (!weekMap[week]) weekMap[week] = {};
    for (const ex of session.exercises) {
      const groups = ex.exercise?.muscle_groups ?? ['other'];
      const vol = (ex.actual_weight ?? 0) * (ex.sets ?? 1) * (ex.reps ?? 1);
      for (const g of groups) {
        const key = g.toLowerCase();
        muscleGroups.add(key);
        weekMap[week][key] = (weekMap[week][key] ?? 0) + vol;
      }
    }
  }

  const data = Object.entries(weekMap).map(([week, groups]) => ({ week, ...groups }));
  const groups = Array.from(muscleGroups).slice(0, 7);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        No session data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(value, name) => [typeof value === 'number' ? Math.round(value) : value, name]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {groups.map(g => (
          <Bar key={g} dataKey={g} stackId="a" fill={colorFor(g)} radius={[0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
