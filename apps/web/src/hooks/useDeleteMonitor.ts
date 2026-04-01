import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

export function useDeleteMonitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (monitorId: string) => {
      await api.delete(`/monitors/${monitorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
  });
}
