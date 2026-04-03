import { useEffect, useState, useRef } from 'react';
import { useMonitors } from '../hooks/useMonitors';
import { MonitorCard } from '../components/MonitorCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { AddMonitorModal } from '../components/AddMonitorModal';
import { Toast } from '../components/Toast';
import { connectWebSocket } from '../lib/websocket';
import api from '../lib/axios';
import { useQuery } from '@tanstack/react-query';

function useAiStatus() {
  return useQuery({
    queryKey: ['ai-status'],
    queryFn: async () => {
      const { data } = await api.get('/health/ai');
      return data as { aiFeatures: string };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function Dashboard() {
  const { data: monitors, isLoading, isError, error, refetch } = useMonitors();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: aiStatus } = useAiStatus();

  useEffect(() => {
    connectWebSocket();
  }, []);

  // Debounced AI search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.post('/monitors/search', { query: searchQuery });
        setSearchResults(data);
      } catch {
        // Fallback: simple text search client-side
        const q = searchQuery.toLowerCase();
        setSearchResults((monitors ?? []).filter((m: any) => m.name.toLowerCase().includes(q)));
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, [searchQuery, monitors]);

  const displayedMonitors = searchQuery.trim() ? (searchResults ?? []) : (monitors ?? []);

  const upCount =
    displayedMonitors?.filter((m: any) => m.status === 'up' || m.checkResults?.[0]?.isUp).length ??
    0;
  const downCount =
    displayedMonitors?.filter(
      (m: any) => m.status === 'down' || (m.checkResults?.[0] && !m.checkResults[0].isUp),
    ).length ?? 0;
  const avgUptime = displayedMonitors?.length
    ? (
        displayedMonitors.reduce((sum: number, m: any) => sum + (m.uptime ?? 0), 0) /
        displayedMonitors.length
      ).toFixed(2)
    : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Add monitor
        </button>
      </div>

      {/* AI Search bar */}
      {(monitors?.length ?? 0) > 0 && (
        <div className="mb-6 relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search monitors... try "show me what&apos;s down" or "SSL expiring soon"'
                className="w-full px-4 py-2 pr-32 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isSearching && <span className="text-xs text-gray-400">Searching...</span>}
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                  AI search
                </span>
              </div>
            </div>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary bar */}
      {displayedMonitors?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: displayedMonitors.length },
            { label: 'Up', value: upCount, className: 'text-green-600 dark:text-green-400' },
            { label: 'Down', value: downCount, className: 'text-red-600 dark:text-red-400' },
            { label: 'Avg Uptime', value: avgUptime ? `${avgUptime}%` : 'N/A' },
          ].map(({ label, value, className }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                {label}
              </p>
              <p
                className={`text-2xl font-bold ${className ?? 'text-gray-900 dark:text-gray-100'}`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {isLoading && <LoadingSkeleton rows={3} />}
      {isError && (
        <ErrorMessage
          message={(error as any)?.message ?? 'Failed to load monitors'}
          onRetry={refetch}
        />
      )}
      {!isLoading && !isError && monitors?.length === 0 && (
        <EmptyState
          title="No monitors yet"
          description="Add your first monitor to start tracking uptime."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Add your first monitor
            </button>
          }
        />
      )}
      {!isLoading && !isError && monitors?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedMonitors.map((m: any) => (
            <MonitorCard key={m.id} monitor={m} />
          ))}
        </div>
      )}

      {showModal && (
        <AddMonitorModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setToast({ message: 'Monitor added!', type: 'success' });
          }}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* AI status indicator in footer */}
      <div className="mt-8 flex justify-end">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span
            className={`w-2 h-2 rounded-full ${
              aiStatus?.aiFeatures === 'active' ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          {aiStatus?.aiFeatures === 'active' ? 'AI features active' : 'AI unavailable'}
        </div>
      </div>
    </div>
  );
}
