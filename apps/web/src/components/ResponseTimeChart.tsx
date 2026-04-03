import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

interface DataPoint {
  time: string;
  responseTime: number;
  checkedAt?: string;
}

interface AnomalyPoint {
  detectedAt: string;
  responseTimeMs: number;
}

export function ResponseTimeChart({
  data,
  timeRange,
  anomalies,
}: {
  data: DataPoint[];
  timeRange?: string;
  anomalies?: AnomalyPoint[];
}) {
  // Build a set of time labels where anomalies occurred for quick lookup
  const anomalyTimes = new Set(
    (anomalies ?? []).map((a) => {
      const d = new Date(a.detectedAt);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }),
  );

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
          {data
            .filter((d) => anomalyTimes.has(d.time))
            .map((d) => (
              <ReferenceDot
                key={d.time}
                x={d.time}
                y={d.responseTime}
                r={5}
                fill="#f97316"
                stroke="white"
                strokeWidth={1}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
      {timeRange && <p className="text-xs text-center text-gray-400 mt-1">Range: {timeRange}</p>}
    </div>
  );
}
