import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

export function useUpdateMonitor(monitorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.patch(`/monitors/${monitorId}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['monitor', monitorId] });
    },
  });
}
