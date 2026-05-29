import useSWR from 'swr';
import { Exercise } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useExercises() {
  const { data, error, isLoading, mutate } = useSWR<Exercise[]>('/api/exercises', fetcher);
  return { exercises: data ?? [], error, isLoading, mutate };
}

export function useExercise(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Exercise>(
    id ? `/api/exercises/${id}` : null,
    fetcher
  );
  return { exercise: data, error, isLoading, mutate };
}
