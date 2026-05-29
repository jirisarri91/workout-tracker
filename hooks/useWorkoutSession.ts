import useSWR from 'swr';
import { WorkoutSession } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useWorkoutSession(date: string | null) {
  const { data, error, isLoading, mutate } = useSWR<WorkoutSession>(
    date ? `/api/workout-sessions?date=${date}` : null,
    fetcher
  );
  return { session: data, error, isLoading, mutate };
}

export function useWorkoutSessions(year: number, month: number) {
  const { data, error, isLoading, mutate } = useSWR<WorkoutSession[]>(
    `/api/workout-sessions?year=${year}&month=${month}`,
    fetcher
  );
  return { sessions: data ?? [], error, isLoading, mutate };
}
