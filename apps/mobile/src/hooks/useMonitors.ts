import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useMonitors() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['monitors'],
    queryFn: async () => {
      const res = await api.get('/monitors');
      return res.data;
    },
    refetchInterval: 30000,
  });
  return { data, isLoading, isError, error, refetch };
}
