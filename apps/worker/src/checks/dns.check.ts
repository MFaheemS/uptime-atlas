import dns from 'dns';
import type { DnsCheckResult } from '../types/check.types.js';

export async function checkDns(url: string): Promise<DnsCheckResult> {
  const hostname = new URL(url).hostname;
  const start = performance.now();
  try {
    const result = await dns.promises.lookup(hostname);
    const end = performance.now();
    const resolutionTimeMs = Math.round(end - start);
    return { resolutionTimeMs, resolvedIp: result.address };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { resolutionTimeMs: null, error };
  }
}
