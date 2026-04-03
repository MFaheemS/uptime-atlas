interface RecentResult {
  responseTimeMs: number;
}

interface AnomalyResult {
  isAnomaly: boolean;
  zScore: number;
  message: string | null;
}

export function detectAnomaly(
  currentResponseTime: number,
  recentResults: RecentResult[],
): AnomalyResult {
  if (recentResults.length < 10) {
    return { isAnomaly: false, zScore: 0, message: null };
  }

  const values = recentResults.map((r) => r.responseTimeMs);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return { isAnomaly: false, zScore: 0, message: null };
  }

  const zScore = (currentResponseTime - mean) / stdDev;
  const isAnomaly = zScore > 2.0;

  const message = isAnomaly
    ? `Response time of ${currentResponseTime}ms is ${zScore.toFixed(1)}σ above the 24h average of ${Math.round(mean)}ms`
    : null;

  return { isAnomaly, zScore, message };
}
