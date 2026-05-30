'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { useExercises } from '@/hooks/useExercises';
import { useProgress } from '@/hooks/useProgress';
import { ExerciseProgressChart } from '@/components/progress/ExerciseProgressChart';
import { VolumeChart } from '@/components/progress/VolumeChart';
import { WeightTracker } from '@/components/progress/WeightTracker';
import { WorkoutSession } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Tab = 'strength' | 'volume' | 'weight';

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>('strength');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const { exercises } = useExercises();
  const { points, isLoading: loadingProgress } = useProgress(selectedExerciseId);
  const { data: sessions = [] } = useSWR<WorkoutSession[]>('/api/workout-sessions', fetcher);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'strength', label: 'Strength' },
    { id: 'volume', label: 'Volume' },
    { id: 'weight', label: 'Body Weight' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-900">Progress</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'strength' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <label className="block text-xs font-medium text-slate-500 mb-2">Select Exercise</label>
            <select
              value={selectedExerciseId ?? ''}
              onChange={e => setSelectedExerciseId(e.target.value || null)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Choose an exercise...</option>
              {exercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          {selectedExerciseId && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="font-semibold text-slate-800 mb-1">
                {exercises.find(e => e.id === selectedExerciseId)?.name}
              </h3>
              <p className="text-xs text-slate-400 mb-3">Weight over time · Orange dots = PR</p>
              {loadingProgress ? (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
              ) : (
                <ExerciseProgressChart data={points} />
              )}
              {points.filter(p => p.isPR).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Personal Records</p>
                  <div className="flex flex-col gap-1">
                    {points.filter(p => p.isPR).slice(-3).reverse().map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{p.date}</span>
                        <span className="font-semibold text-orange-600">{p.weight} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'volume' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 className="font-semibold text-slate-800 mb-1">Weekly Volume</h3>
          <p className="text-xs text-slate-400 mb-3">Total tonnage (kg × sets × reps) per muscle group</p>
          <VolumeChart sessions={sessions.filter(s => s.exercises)} />
        </div>
      )}

      {tab === 'weight' && <WeightTracker />}
    </div>
  );
}
