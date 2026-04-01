import { useIncidents } from '../hooks/useIncidents';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';

export function Incidents() {
  const { data: incidents, isLoading, isError, error, refetch } = useIncidents();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Incidents</h2>
      {isLoading && <LoadingSkeleton rows={4} />}
      {isError && (
        <ErrorMessage
          message={(error as any)?.message ?? 'Failed to load incidents'}
          onRetry={refetch}
        />
      )}
      {!isLoading && !isError && incidents?.length === 0 && (
        <EmptyState title="No incidents" description="Great news — no incidents recorded." />
      )}
      {!isLoading && !isError && incidents?.length > 0 && (
        <div className="space-y-3">
          {incidents.map((inc: any) => (
            <div
              key={inc.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm"
            >
              <div className="flex justify-between">
                <span className="font-medium">{inc.monitorName ?? inc.monitor?.name}</span>
                <span className="text-gray-400">
                  {inc.duration ? `${inc.duration}m` : 'Ongoing'}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {new Date(inc.startedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
