'use client';
import { ObjectiveEditor } from '@/components/dashboard/ObjectiveEditor';
import { WeightTracker } from '@/components/progress/WeightTracker';

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-900">Información Personal</h1>
      <ObjectiveEditor />
      <WeightTracker />
    </div>
  );
}
