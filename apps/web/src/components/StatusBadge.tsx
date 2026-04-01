type Status = 'up' | 'down' | 'degraded';

const config: Record<Status, { label: string; className: string }> = {
  up: {
    label: 'UP',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  down: {
    label: 'DOWN',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  degraded: {
    label: 'DEGRADED',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
};

export function StatusBadge({ status }: { status: string }) {
  const s = (status?.toLowerCase() as Status) in config ? (status.toLowerCase() as Status) : 'down';
  const { label, className } = config[s];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
