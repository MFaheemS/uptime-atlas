import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export function useIncidents() {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const { data } = await api.get('/incidents');
      return data;
    },
    refetchInterval: 30_000,
  });
}
