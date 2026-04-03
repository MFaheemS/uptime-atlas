import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { useMonitors } from '../hooks/useMonitors';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return '—';
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function Incidents() {
  const [monitorId, setMonitorId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: monitors } = useMonitors();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['incidents', monitorId, status, page],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page) };
      if (monitorId) params.monitorId = monitorId;
      if (status) params.status = status;
      const { data } = await api.get('/incidents', { params });
      return data;
    },
    refetchInterval: 30_000,
  });

  const openIncidents = (data?.incidents ?? []).filter((i: any) => !i.resolvedAt);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Incidents</h2>

      {/* Live open incidents banner */}
      {openIncidents.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm font-medium">
          ⚠️ {openIncidents.length} open incident{openIncidents.length > 1 ? 's' : ''} — monitors
          are currently down
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={monitorId}
          onChange={(e) => {
            setMonitorId(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <option value="">All monitors</option>
          {(monitors ?? []).map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {isLoading && <LoadingSkeleton rows={4} />}
      {isError && (
        <ErrorMessage
          message={(error as any)?.message ?? 'Failed to load incidents'}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && data?.incidents?.length === 0 && (
        <EmptyState title="No incidents" description="No incidents recorded — great job!" />
      )}

      {!isLoading && !isError && data?.incidents?.length > 0 && (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 pr-4 font-medium">Monitor</th>
                  <th className="pb-2 pr-4 font-medium">Started</th>
                  <th className="pb-2 pr-4 font-medium">Resolved</th>
                  <th className="pb-2 pr-4 font-medium">Duration</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">AI Summary</th>
                </tr>
              </thead>
              <tbody>
                {data.incidents.map((inc: any) => (
                  <>
                    <tr
                      key={inc.id}
                      onClick={() => setExpandedId(expandedId === inc.id ? null : inc.id)}
                      className="cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                        {inc.monitor?.name}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                        {new Date(inc.startedAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                        {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                        {formatDuration(inc.durationMs)}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={inc.resolvedAt ? 'up' : 'down'} />
                      </td>
                      <td className="py-3 text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {inc.aiSummary
                          ? inc.aiSummary.slice(0, 80) + (inc.aiSummary.length > 80 ? '…' : '')
                          : '—'}
                      </td>
                    </tr>
                    {expandedId === inc.id && (
                      <tr key={`${inc.id}-expanded`} className="bg-gray-50 dark:bg-gray-800/50">
                        <td colSpan={6} className="px-4 py-4">
                          {inc.aiSummary && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                AI Summary
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {inc.aiSummary}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 italic">Generated by AI</p>
                            </div>
                          )}
                          {inc.checkResults?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Check Results
                              </p>
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {inc.checkResults.map((c: any) => (
                                  <div
                                    key={c.id}
                                    className="flex gap-4 text-xs text-gray-600 dark:text-gray-400"
                                  >
                                    <span>{new Date(c.checkedAt).toLocaleString()}</span>
                                    <span>{c.isUp ? '✓ Up' : '✗ Down'}</span>
                                    <span>{c.responseTimeMs}ms</span>
                                    {c.error && <span className="text-red-400">{c.error}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Page {data.page} of {data.totalPages} ({data.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
