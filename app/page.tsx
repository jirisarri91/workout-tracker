'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { useWorkoutSessions } from '@/hooks/useWorkoutSession';
import { useWorkoutPlans } from '@/hooks/useWorkoutPlan';
import { WorkoutCalendar } from '@/components/dashboard/WorkoutCalendar';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { WeeklyDigest } from '@/components/dashboard/WeeklyDigest';
import { PageSpinner } from '@/components/ui/Spinner';

export default function DashboardPage() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);

  const { sessions, isLoading: loadingSessions, mutate: mutateSessions } = useWorkoutSessions(year, month);
  const { plans, isLoading: loadingPlans, mutate: mutatePlans } = useWorkoutPlans(year, month);

  function refresh() {
    mutateSessions();
    mutatePlans();
  }

  if (loadingSessions || loadingPlans) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mis Entrenos</h1>
        <span className="text-sm text-slate-400">{format(now, 'MMMM yyyy')}</span>
      </div>

      <SummaryCards plans={plans} sessions={sessions} />
      <WeeklyDigest />
      <WorkoutCalendar sessions={sessions} plans={plans} onSessionChange={refresh} />
    </div>
  );
}
