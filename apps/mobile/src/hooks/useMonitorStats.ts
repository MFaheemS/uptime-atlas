import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useMonitorStats(id: string, range: '1h' | '24h' | '7d' = '24h') {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['monitor-stats', id, range],
    queryFn: async () => {
      const res = await api.get(`/monitors/${id}/stats`, { params: { range } });
      return res.data;
    },
  });
  return { data, isLoading, isError, error, refetch };
}
