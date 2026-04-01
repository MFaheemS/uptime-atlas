export function UptimeBadge({ uptime }: { uptime: number }) {
  const color =
    uptime >= 99
      ? 'text-green-600 dark:text-green-400'
      : uptime >= 95
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400';
  return <span className={`text-sm font-semibold ${color}`}>{uptime.toFixed(2)}%</span>;
}
