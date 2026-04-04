import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useIncidents() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await api.get('/incidents');
      return res.data;
    },
  });
  return { data, isLoading, isError, error, refetch };
}
