import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  time: string;
  responseTime: number;
}

export function ResponseTimeChart({ data, timeRange }: { data: DataPoint[]; timeRange?: string }) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="ms" />
          <Tooltip formatter={(v: number) => [`${v}ms`, 'Response Time']} />
          <Line
            type="monotone"
            dataKey="responseTime"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
      {timeRange && <p className="text-xs text-center text-gray-400 mt-1">Range: {timeRange}</p>}
    </div>
  );
}
