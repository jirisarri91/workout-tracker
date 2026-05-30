import useSWR from 'swr';
import { WeightEntry } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useWeightEntries() {
  const { data, error, isLoading, mutate } = useSWR<WeightEntry[]>('/api/weight-entries', fetcher);
  return { entries: data ?? [], error, isLoading, mutate };
}
