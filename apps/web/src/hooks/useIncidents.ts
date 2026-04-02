import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export function useIncidents(params?: { monitorId?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: ['incidents', params?.monitorId, params?.status, params?.page],
    queryFn: async () => {
      const { data } = await api.get('/incidents', { params });
      return data;
    },
    refetchInterval: 30_000,
  });
}
