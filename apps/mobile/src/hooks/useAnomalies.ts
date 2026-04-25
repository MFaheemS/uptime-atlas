import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface AnomalyEvent {
  id: string;
  monitorId: string;
  zScore: number;
  responseTimeMs: number;
  meanResponseTimeMs: number;
  detectedAt: string;
}

export function useAnomalies(monitorId: string) {
  return useQuery({
    queryKey: ['anomalies', monitorId],
    queryFn: async () => {
      const res = await api.get(`/monitors/${monitorId}/anomalies`);
      return res.data as AnomalyEvent[];
    },
    enabled: !!monitorId,
    staleTime: 60_000,
  });
}

export function useRecentAnomaly(monitorId: string) {
  const { data } = useAnomalies(monitorId);
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return (data ?? []).some((a) => new Date(a.detectedAt).getTime() > oneHourAgo);
}
