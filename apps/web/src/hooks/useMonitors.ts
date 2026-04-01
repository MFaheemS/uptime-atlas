import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export function useMonitors() {
  return useQuery({
    queryKey: ['monitors'],
    queryFn: async () => {
      const { data } = await api.get('/monitors');
      return data;
    },
    refetchInterval: 30_000,
  });
}
