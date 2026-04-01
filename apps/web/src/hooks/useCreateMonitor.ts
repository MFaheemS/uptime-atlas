import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

export function useCreateMonitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      url: string;
      intervalMinutes: number;
      alertThreshold: number;
    }) => {
      const { data } = await api.post('/monitors', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
  });
}
