interface DayData {
  date: string;
  uptime?: number;
}

function barColor(day: DayData): string {
  if (day.uptime === undefined) return 'bg-gray-200 dark:bg-gray-700';
  if (day.uptime >= 99) return 'bg-green-500';
  if (day.uptime > 0) return 'bg-red-500';
  return 'bg-red-700';
}

export function UptimeBar({ days }: { days: DayData[] }) {
  return (
    <div className="flex gap-0.5 items-end h-8">
      {days.map((day, i) => (
        <div
          key={i}
          className={`flex-1 h-full rounded-sm ${barColor(day)} relative group cursor-default`}
          title={`${day.date}: ${day.uptime !== undefined ? day.uptime.toFixed(1) + '%' : 'No data'}`}
        >
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
            {day.date}
            <br />
            {day.uptime !== undefined ? `${day.uptime.toFixed(1)}%` : 'No data'}
          </div>
        </div>
      ))}
    </div>
  );
}
