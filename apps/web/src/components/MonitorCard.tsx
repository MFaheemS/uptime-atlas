import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { UptimeBadge } from './UptimeBadge';

interface Monitor {
  id: string;
  name: string;
  url: string;
  status?: string;
  uptime?: number;
  lastCheckedAt?: string;
  responseTime?: number;
}

export const MonitorCard = memo(function MonitorCard({ monitor }: { monitor: Monitor }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/monitors/${monitor.id}`)}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {monitor.name}
          </h3>
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
