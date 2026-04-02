import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { StatusBadge } from '../components/StatusBadge';
import { UptimeBar } from '../components/UptimeBar';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorMessage } from '../components/ErrorMessage';

function overallStatus(status: string): { label: string; color: string } {
  if (status === 'up')
    return { label: 'All systems operational', color: 'text-green-600 dark:text-green-400' };
  if (status === 'down') return { label: 'Major outage', color: 'text-red-600 dark:text-red-400' };
  return { label: 'Partial outage', color: 'text-yellow-600 dark:text-yellow-400' };
}

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return 'Unknown duration';
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

export function PublicStatus() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-status', slug],
    queryFn: async () => {
      const { data } = await api.get(`/status/${slug}`);
      return data;
    },
    refetchInterval: 30_000,
  });

  if (isLoading)
    return (
      <div className="p-8">
        <LoadingSkeleton rows={3} />
      </div>
    );
  if (isError)
    return (
      <div className="p-8">
        <ErrorMessage message={(error as any)?.message ?? 'Status page not found'} />
      </div>
    );

  const { label, color } = overallStatus(data?.status);
  const statusPageUrl = window.location.href;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {/* meta refresh fallback */}
      <noscript>
        <meta httpEquiv="refresh" content="60" />
      </noscript>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-1 text-gray-900 dark:text-gray-100">
            {data?.name ?? slug}
          </h1>
          <p className={`text-lg font-semibold ${color}`}>{label}</p>
          <p className="text-gray-400 text-sm mt-1">Last updated: {new Date().toLocaleString()}</p>
        </div>

        {/* Monitor list */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900 dark:text-gray-100">{data?.name}</span>
              <StatusBadge status={data?.status ?? 'unknown'} />
            </div>
            <UptimeBar
              days={(data?.dailyUptime ?? []).map((d: any) => ({
                date: d.date,
                uptime: d.uptime,
              }))}
            />
            <p className="text-xs text-gray-400 mt-2">
              Uptime (30d): {data?.uptime30d != null ? `${data.uptime30d.toFixed(2)}%` : 'No data'}
            </p>
          </div>
        </div>

        {/* Last 5 resolved incidents */}
        {data?.resolvedIncidents?.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Recent Incidents
            </h2>
            <div className="space-y-2">
              {data.resolvedIncidents.map((inc: any) => (
                <div
                  key={inc.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm"
                >
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>{new Date(inc.startedAt).toLocaleDateString()}</span>
                    <span className="text-gray-400">{formatDuration(inc.durationMs)}</span>
                  </div>
                  {inc.aiSummary && (
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs">{inc.aiSummary}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Copy link */}
        <div className="flex justify-center">
          <button
            onClick={() => navigator.clipboard.writeText(statusPageUrl)}
            className="px-4 py-2 text-sm rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          >
            Copy status page link
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
          Powered by{' '}
          <a
            href="https://github.com/your-org/uptime-atlas"
            className="text-blue-500 hover:underline"
          >
            UptimeAtlas
          </a>
        </footer>
      </div>
    </div>
  );
}
