import useSWR from 'swr';
import { Mesocycle } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useMesocycles() {
  const { data, error, isLoading, mutate } = useSWR<Mesocycle[]>('/api/mesocycles', fetcher);
  return { mesocycles: data ?? [], error, isLoading, mutate };
}
