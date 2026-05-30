'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { ExerciseProgressPoint } from '@/types';
import { format, parseISO } from 'date-fns';

interface Props {
  data: ExerciseProgressPoint[];
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: ExerciseProgressPoint;
}

function PRDot(props: DotProps) {
  const { cx, cy, payload } = props;
  if (!payload?.isPR) return <Dot cx={cx} cy={cy} r={3} fill="#f97316" stroke="none" />;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#f97316" />
      <text x={cx} y={(cy ?? 0) - 10} textAnchor="middle" fill="#f97316" fontSize={10} fontWeight="bold">PR</text>
    </g>
  );
}

export function ExerciseProgressChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        No data yet for this exercise
      </div>
    );
  }

  const formatted = data.map(d => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="kg" />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(value) => [`${value} kg`, 'Weight']}
          labelStyle={{ color: '#475569', fontWeight: 600 }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#f97316"
          strokeWidth={2}
          dot={<PRDot />}
          activeDot={{ r: 5, fill: '#ea580c' }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
