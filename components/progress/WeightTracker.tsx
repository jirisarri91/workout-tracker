'use client';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subWeeks } from 'date-fns';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function WeightTracker() {
  const { entries, mutate } = useWeightEntries();
  const { toast } = useToast();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const chartData = sorted.map(e => ({ label: format(parseISO(e.date), 'MMM d'), weight: e.weight_kg, id: e.id }));

  const recent = sorted.filter(e => parseISO(e.date) >= subWeeks(new Date(), 4));
  const trend =
    recent.length >= 2
      ? Number(recent[recent.length - 1].weight_kg) - Number(recent[0].weight_kg)
      : null;

  async function save() {
    if (!weight) return;
    setSaving(true);
    try {
      await fetch('/api/weight-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, weight_kg: parseFloat(weight) }),
      });
      setWeight('');
      await mutate();
    } catch {
      toast('Failed to save weight', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    try {
      await fetch(`/api/weight-entries/${id}`, { method: 'DELETE' });
      await mutate();
    } catch {
      toast('Failed to delete entry', 'error');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Log form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h3 className="font-semibold text-slate-800 mb-3">Log Weight</h3>
        <div className="flex gap-2 items-end">
          <div className="w-36">
            <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="w-28">
            <Input label="Weight (kg)" type="number" step="0.1" placeholder="70.0" value={weight} onChange={e => setWeight(e.target.value)} />
          </div>
          <Button onClick={save} loading={saving} disabled={!weight} className="mb-0.5">Save</Button>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Body Weight</h3>
            {trend !== null && (
              <span className={`text-sm font-medium ${trend < 0 ? 'text-green-600' : trend > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}kg (4 wk)
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="kg" domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v) => [`${v} kg`, 'Weight']}
              />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log list */}
      {entries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 className="font-semibold text-slate-800 mb-3">History</h3>
          <div className="flex flex-col gap-2">
            {[...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(e => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{format(parseISO(e.date), 'EEE, MMM d yyyy')}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800">{Number(e.weight_kg).toFixed(1)} kg</span>
                  <button
                    onClick={() => deleteEntry(e.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
