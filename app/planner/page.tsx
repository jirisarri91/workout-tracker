'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { useWorkoutPlans, useWorkoutPlan } from '@/hooks/useWorkoutPlan';
import { useExercises } from '@/hooks/useExercises';
import { PlannerDatePicker } from '@/components/planner/PlannerDatePicker';
import { PlanEditor } from '@/components/planner/PlanEditor';
import { AIPlanGenerator } from '@/components/planner/AIPlanGenerator';
import { PageSpinner } from '@/components/ui/Spinner';

export default function PlannerPage() {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { plans, isLoading: loadingPlans, mutate: mutatePlans } = useWorkoutPlans(year, month);
  const { plan, isLoading: loadingPlan, mutate: mutatePlan } = useWorkoutPlan(selectedDate);
  const { exercises, isLoading: loadingExercises } = useExercises();

  function onSaved() {
    mutatePlan();
    mutatePlans();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Workout Planner</h1>
        <AIPlanGenerator date={selectedDate} onPlanCreated={onSaved} />
      </div>
      <PlannerDatePicker
        plans={plans}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />
      {(loadingPlan || loadingExercises) ? (
        <PageSpinner />
      ) : (
        <PlanEditor
          date={selectedDate}
          plan={plan}
          allExercises={exercises}
          allPlans={plans ?? []}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
