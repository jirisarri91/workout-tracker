import useSWR from 'swr';
import { WorkoutPlan } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useWorkoutPlan(date: string | null) {
  const { data, error, isLoading, mutate } = useSWR<WorkoutPlan>(
    date ? `/api/workout-plans?date=${date}` : null,
    fetcher
  );
  return { plan: data, error, isLoading, mutate };
}

export function useWorkoutPlans(year: number, month: number) {
  const { data, error, isLoading, mutate } = useSWR<WorkoutPlan[]>(
    `/api/workout-plans?year=${year}&month=${month}`,
    fetcher
  );
  return { plans: data ?? [], error, isLoading, mutate };
}
