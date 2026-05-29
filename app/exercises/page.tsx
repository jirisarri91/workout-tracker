'use client';
import { useExercises } from '@/hooks/useExercises';
import { ExerciseList } from '@/components/exercises/ExerciseList';
import { PageSpinner } from '@/components/ui/Spinner';

export default function ExercisesPage() {
  const { exercises, isLoading, mutate } = useExercises();

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-900">Exercise Library</h1>
      <ExerciseList exercises={exercises} onChanged={mutate} />
    </div>
  );
}
