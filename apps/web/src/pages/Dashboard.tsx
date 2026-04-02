import { useEffect, useState } from 'react';
import { useMonitors } from '../hooks/useMonitors';
import { MonitorCard } from '../components/MonitorCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { AddMonitorModal } from '../components/AddMonitorModal';
import { Toast } from '../components/Toast';
import { connectWebSocket } from '../lib/websocket';

export function Dashboard() {
  const { data: monitors, isLoading, isError, error, refetch } = useMonitors();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    connectWebSocket();
  }, []);

  const upCount = monitors?.filter((m: any) => m.status === 'up').length ?? 0;
  const downCount = monitors?.filter((m: any) => m.status === 'down').length ?? 0;
  const avgUptime = monitors?.length
    ? (
        monitors.reduce((sum: number, m: any) => sum + (m.uptime ?? 0), 0) / monitors.length
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

      {/* Summary bar */}
      {monitors?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: monitors.length },
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
          {monitors.map((m: any) => (
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
    </div>
  );
}
