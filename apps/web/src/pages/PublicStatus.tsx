import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { StatusBadge } from '../components/StatusBadge';
import { UptimeBar } from '../components/UptimeBar';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorMessage } from '../components/ErrorMessage';

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          {data?.name ?? slug}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
          Last updated: {new Date().toLocaleString()}
        </p>
        <div className="space-y-4">
          {(data?.monitors ?? []).map((m: any) => (
            <div
              key={m.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900 dark:text-gray-100">{m.name}</span>
                <StatusBadge status={m.status ?? 'down'} />
              </div>
              <UptimeBar
                days={Array.from({ length: 90 }, (_, i) => ({
                  date: '',
                  uptime: m.dailyUptime?.[i]?.uptime,
                }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
