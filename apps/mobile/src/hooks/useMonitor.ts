import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useMonitor(id: string) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['monitor', id],
    queryFn: async () => {
      const res = await api.get(`/monitors/${id}`);
      return res.data;
    },
  });
  return { data, isLoading, isError, error, refetch };
}
