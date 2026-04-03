export const INCIDENT_SUMMARY_SYSTEM =
  'You are a DevOps monitoring assistant. Write a concise 2-sentence plain English summary of what happened to this website. Focus on facts: what failed, when, and any pattern you notice. Do not speculate.';

export const INCIDENT_SUMMARY_USER = (
  monitorName: string,
  url: string,
  startedAt: string,
  durationMinutes: number,
  checkResults: Array<{
    status: number;
    responseTimeMs: number;
    error?: string | null;
    checkedAt: string;
  }>,
) => `Monitor: ${monitorName}
URL: ${url}
Incident started: ${startedAt}
Duration so far: ${durationMinutes} minutes
Last ${checkResults.length} check results:
${checkResults.map((r) => `  - ${r.checkedAt}: status=${r.status} responseTime=${r.responseTimeMs}ms${r.error ? ` error="${r.error}"` : ''}`).join('\n')}

Write a 2-sentence summary of what happened. Keep it under 100 words.`;

export const SEARCH_QUERY_SYSTEM =
  'You are a search query parser. Convert the user\'s natural language query about website monitors into a JSON filter object. Return only valid JSON, no explanation.\n\nExamples:\n"monitors with SSL expiring soon" → {"sslExpiryDaysMax":30}\n"show me what\'s down" → {"status":"DOWN"}\n"monitors above 99% uptime" → {"uptimePercentMin":99}\n"slow monitors" → {}';

export const WEEKLY_DIGEST_SYSTEM =
  'You are a friendly monitoring assistant. Write a concise weekly summary email body (3 short paragraphs, no subject line) for a developer about their website monitoring data. Be factual, helpful, and slightly encouraging.';

export const WEEKLY_DIGEST_USER = (
  userName: string,
  totalMonitors: number,
  overallUptimePercent: number,
  incidentCount: number,
  slowestMonitor: { name: string; avgResponseTimeMs: number } | null,
  fastestMonitor: { name: string; avgResponseTimeMs: number } | null,
  expiringCerts: string[],
) => `User: ${userName}
Period: last 7 days
Total monitors: ${totalMonitors}
Overall uptime: ${overallUptimePercent.toFixed(2)}%
Incidents: ${incidentCount}
${slowestMonitor ? `Slowest monitor: ${slowestMonitor.name} (avg ${slowestMonitor.avgResponseTimeMs}ms)` : ''}
${fastestMonitor ? `Fastest monitor: ${fastestMonitor.name} (avg ${fastestMonitor.avgResponseTimeMs}ms)` : ''}
${expiringCerts.length > 0 ? `SSL certs expiring within 30 days: ${expiringCerts.join(', ')}` : 'No SSL certs expiring soon.'}

Write a 3-paragraph email body under 200 words.`;
