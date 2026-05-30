import useSWR from 'swr';
import { WeeklyScheduleSlot } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useWeeklySchedule() {
  const { data, error, isLoading, mutate } = useSWR<WeeklyScheduleSlot[]>(
    '/api/weekly-schedule',
    fetcher
  );
  return { slots: data ?? [], error, isLoading, mutate };
}
