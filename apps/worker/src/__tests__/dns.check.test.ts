import { describe, it, expect } from 'vitest';
import { checkDns } from '../checks/dns.check.js';

describe('checkDns', () => {
  it('resolves example.com with resolutionTimeMs > 0 and a valid IP', async () => {
    const result = await checkDns('https://example.com');
    expect(result.resolutionTimeMs).not.toBeNull();
    expect(result.resolutionTimeMs).toBeGreaterThan(0);
    expect(result.resolvedIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
  }, 10_000);

  it('returns resolutionTimeMs=null and an error for non-existent domains', async () => {
    const result = await checkDns('https://this-does-not-exist-xyz-domain.com');
    expect(result.resolutionTimeMs).toBeNull();
    expect(result.error).toBeTruthy();
  }, 10_000);
});
