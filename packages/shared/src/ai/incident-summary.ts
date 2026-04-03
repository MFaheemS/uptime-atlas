import { callGroq } from './groq.client.js';
import { INCIDENT_SUMMARY_SYSTEM, INCIDENT_SUMMARY_USER } from './prompts.js';

interface CheckResultInput {
  status: number;
  responseTimeMs: number;
  error?: string | null;
  checkedAt: Date | string;
}

interface IncidentInput {
  startedAt: Date | string;
  resolvedAt?: Date | string | null;
}

interface MonitorInput {
  name: string;
  url: string;
}

export async function generateIncidentSummary(
  incident: IncidentInput,
  checkResults: CheckResultInput[],
  monitor: MonitorInput,
): Promise<string | null> {
  const startedAt = new Date(incident.startedAt);
  const now = incident.resolvedAt ? new Date(incident.resolvedAt) : new Date();
  const durationMinutes = Math.round((now.getTime() - startedAt.getTime()) / 60000);

  const last10 = checkResults.slice(0, 10).map((r) => ({
    status: r.status,
    responseTimeMs: r.responseTimeMs,
    error: r.error ?? null,
    checkedAt: new Date(r.checkedAt).toISOString(),
  }));

  const userPrompt = INCIDENT_SUMMARY_USER(
    monitor.name,
    monitor.url,
    startedAt.toISOString(),
    durationMinutes,
    last10,
  );

  return callGroq(userPrompt, INCIDENT_SUMMARY_SYSTEM, 150, 0.3);
}
