import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from './StatusBadge';
import { UptimeBadge } from './UptimeBadge';
import api from '../lib/axios';

interface Monitor {
  id: string;
  name: string;
  url: string;
  status?: string;
  uptime?: number;
  lastCheckedAt?: string;
  responseTime?: number;
}

function useRecentAnomaly(monitorId: string) {
  return useQuery({
    queryKey: ['anomalies', monitorId],
    queryFn: async () => {
      const { data } = await api.get(`/monitors/${monitorId}/anomalies`);
      return data as Array<{ detectedAt: string }>;
    },
    staleTime: 60_000,
    retry: false,
  });
}

export const MonitorCard = memo(function MonitorCard({ monitor }: { monitor: Monitor }) {
  const navigate = useNavigate();
  const { data: anomalies } = useRecentAnomaly(monitor.id);

  const recentAnomaly = anomalies?.some(
    (a) => Date.now() - new Date(a.detectedAt).getTime() < 60 * 60 * 1000,
  );

  return (
    <div
      onClick={() => navigate(`/monitors/${monitor.id}`)}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {monitor.name}
            </h3>
            {recentAnomaly && (
              <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                Anomaly
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{monitor.url}</p>
        </div>
        <StatusBadge status={monitor.status ?? 'down'} />
      </div>
      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
        {monitor.uptime !== undefined && (
          <div>
            <span className="text-xs uppercase tracking-wide block mb-0.5">Uptime</span>
            <UptimeBadge uptime={monitor.uptime} />
          </div>
        )}
        {monitor.responseTime !== undefined && (
          <div>
            <span className="text-xs uppercase tracking-wide block mb-0.5">Response</span>
            <span className="text-sm font-medium">{monitor.responseTime}ms</span>
          </div>
        )}
        {monitor.lastCheckedAt && (
          <div className="ml-auto text-right">
            <span className="text-xs uppercase tracking-wide block mb-0.5">Last check</span>
            <span className="text-xs">{new Date(monitor.lastCheckedAt).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
});
