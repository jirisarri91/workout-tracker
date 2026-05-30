import useSWR from 'swr';
import { ExerciseProgressPoint } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useProgress(exerciseId: string | null) {
  const { data, error, isLoading } = useSWR<ExerciseProgressPoint[]>(
    exerciseId ? `/api/progress?exerciseId=${exerciseId}` : null,
    fetcher
  );
  return { points: data ?? [], error, isLoading };
}
