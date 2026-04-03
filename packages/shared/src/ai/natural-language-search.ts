import { callGroq } from './groq.client.js';
import { SEARCH_QUERY_SYSTEM } from './prompts.js';

export interface MonitorFilter {
  status?: 'UP' | 'DOWN';
  sslExpiryDaysMax?: number;
  uptimePercentMin?: number;
  nameContains?: string;
}

export async function parseSearchQuery(query: string): Promise<MonitorFilter | null> {
  const result = await callGroq(query, SEARCH_QUERY_SYSTEM, 100, 0.3);
  if (!result) return null;

  try {
    const parsed = JSON.parse(result.trim());
    // Validate it's an object and extract known fields
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const filter: MonitorFilter = {};
    if (parsed.status === 'UP' || parsed.status === 'DOWN') filter.status = parsed.status;
    if (typeof parsed.sslExpiryDaysMax === 'number')
      filter.sslExpiryDaysMax = parsed.sslExpiryDaysMax;
    if (typeof parsed.uptimePercentMin === 'number')
      filter.uptimePercentMin = parsed.uptimePercentMin;
    if (typeof parsed.nameContains === 'string') filter.nameContains = parsed.nameContains;
    return filter;
  } catch {
    return null;
  }
}
