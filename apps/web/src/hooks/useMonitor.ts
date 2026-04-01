import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export function useMonitor(monitorId: string) {
  return useQuery({
    queryKey: ['monitor', monitorId],
    queryFn: async () => {
      const { data } = await api.get(`/monitors/${monitorId}`);
      return data;
    },
    refetchInterval: 30_000,
    enabled: !!monitorId,
  });
}
