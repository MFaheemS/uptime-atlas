import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMonitor } from '../hooks/useMonitor';
import { useMonitorStats } from '../hooks/useMonitorStats';
import { useDeleteMonitor } from '../hooks/useDeleteMonitor';
import api from '../lib/axios';
import { StatusBadge } from '../components/StatusBadge';
import { UptimeBadge } from '../components/UptimeBadge';
import { ResponseTimeChart } from '../components/ResponseTimeChart';
import { UptimeBar } from '../components/UptimeBar';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorMessage } from '../components/ErrorMessage';
import { ConfirmDialog } from '../components/ConfirmDialog';

const TIME_RANGES = ['1h', '24h', '7d', '30d'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

export function MonitorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: monitor, isLoading, isError, error } = useMonitor(id!);
  const { data: stats } = useMonitorStats(id!, timeRange);
  const deleteMutation = useDeleteMonitor();
  const { data: anomalies } = useQuery({
    queryKey: ['anomalies', id],
    queryFn: async () => {
      const { data } = await api.get(`/monitors/${id}/anomalies`);
      return data as Array<{ detectedAt: string; responseTimeMs: number }>;
    },
    enabled: !!id,
    staleTime: 60_000,
    retry: false,
  });

  async function handleDelete() {
    await deleteMutation.mutateAsync(id!);
    navigate('/');
  }

  if (isLoading)
    return (
      <div className="p-6">
        <LoadingSkeleton rows={4} />
      </div>
    );
  if (isError)
    return (
      <div className="p-6">
        <ErrorMessage message={(error as any)?.message ?? 'Failed to load monitor'} />
      </div>
    );
  if (!monitor) return null;

  const chartData = (stats?.responseTimeSeries ?? monitor.checkResults ?? []).map((r: any) => ({
    time: new Date(r.checkedAt ?? r.time).toLocaleTimeString(),
    responseTime: r.responseTime ?? r.duration ?? 0,
  }));

  const uptimeDays: { date: string; uptime?: number }[] = stats?.dailyUptime ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{monitor.name}</h2>
            <StatusBadge status={monitor.status ?? 'down'} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{monitor.url}</p>
        </div>
        <div className="flex gap-2">
          {monitor.slug && (
            <button
              onClick={() =>
                navigator.clipboard.writeText(`${window.location.origin}/status/${monitor.slug}`)
              }
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800"
            >
              Copy status link
            </button>
          )}
          <button
            onClick={() => setShowConfirm(true)}
            className="px-3 py-1.5 text-sm rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Uptime (30d)',
            value:
              stats?.uptime30d !== undefined ? <UptimeBadge uptime={stats.uptime30d} /> : 'N/A',
          },
          {
            label: 'Total Incidents',
            value: stats?.totalIncidents ?? monitor._count?.incidents ?? 'N/A',
          },
          {
            label: 'Avg Response',
            value: stats?.avgResponseTime ? `${stats.avgResponseTime}ms` : 'N/A',
          },
          { label: 'SSL Expiry', value: stats?.sslExpiresIn ? `${stats.sslExpiresIn}d` : 'N/A' },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
          >
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
              {label}
            </p>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</div>
          </div>
        ))}
      </div>

      {/* Time range toggle */}
      <div className="flex gap-2">
        {TIME_RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
              timeRange === r
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Response Time
        </h3>
        <ResponseTimeChart data={chartData} timeRange={timeRange} anomalies={anomalies} />
      </div>

      {/* Uptime bar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Last 90 Days
        </h3>
        <UptimeBar
          days={
            uptimeDays.length >= 90
              ? uptimeDays.slice(-90)
              : Array.from({ length: 90 }, (_, i) => {
                  const d = uptimeDays[i];
                  return d ?? { date: '' };
                })
          }
        />
      </div>

      {/* Recent incidents */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Recent Incidents
        </h3>
        {(stats?.incidents ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">No incidents recorded.</p>
        ) : (
          <div className="space-y-2">
            {(stats?.incidents ?? []).slice(0, 5).map((inc: any) => (
              <div
                key={inc.id}
                className="flex items-start justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {new Date(inc.startedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {inc.aiSummary ?? 'No AI summary yet.'}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 ml-4">
                  {inc.duration ? `${inc.duration}m` : 'Ongoing'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Delete monitor?"
          message={`Are you sure you want to delete "${monitor.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
