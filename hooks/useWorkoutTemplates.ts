import useSWR from 'swr';
import { WorkoutTemplate } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useWorkoutTemplates() {
  const { data, error, isLoading, mutate } = useSWR<WorkoutTemplate[]>(
    '/api/workout-templates',
    fetcher
  );
  return { templates: data ?? [], error, isLoading, mutate };
}

export function useWorkoutTemplate(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<WorkoutTemplate>(
    id ? `/api/workout-templates/${id}` : null,
    fetcher
  );
  return { template: data, error, isLoading, mutate };
}
