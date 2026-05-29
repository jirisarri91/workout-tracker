import useSWR from 'swr';
import { UserObjectives } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useObjectives() {
  const { data, error, isLoading, mutate } = useSWR<UserObjectives>('/api/objectives', fetcher);
  return { objectives: data, error, isLoading, mutate };
}
