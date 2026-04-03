import { callGroq } from './groq.client.js';
import { WEEKLY_DIGEST_SYSTEM, WEEKLY_DIGEST_USER } from './prompts.js';

interface WeeklyStats {
  totalMonitors: number;
  overallUptimePercent: number;
  incidentCount: number;
  slowestMonitor: { name: string; avgResponseTimeMs: number } | null;
  fastestMonitor: { name: string; avgResponseTimeMs: number } | null;
  expiringCerts: string[];
}

interface UserInput {
  name?: string | null;
  email: string;
}

export async function generateWeeklyDigest(
  user: UserInput,
  weeklyStats: WeeklyStats,
): Promise<string | null> {
  const userName = user.name ?? user.email;
  const userPrompt = WEEKLY_DIGEST_USER(
    userName,
    weeklyStats.totalMonitors,
    weeklyStats.overallUptimePercent,
    weeklyStats.incidentCount,
    weeklyStats.slowestMonitor,
    weeklyStats.fastestMonitor,
    weeklyStats.expiringCerts,
  );

  return callGroq(userPrompt, WEEKLY_DIGEST_SYSTEM, 300, 0.7);
}
