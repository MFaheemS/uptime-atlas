import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export function useMonitorStats(monitorId: string, timeRange?: string) {
  return useQuery({
    queryKey: ['monitor-stats', monitorId, timeRange],
    queryFn: async () => {
      const { data } = await api.get(`/monitors/${monitorId}/stats`, {
        params: timeRange ? { range: timeRange } : undefined,
      });
      return data;
    },
    refetchInterval: 30_000,
    enabled: !!monitorId,
  });
}
