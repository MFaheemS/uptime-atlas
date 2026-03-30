import { describe, it, expect } from 'vitest';
import { checkHttp } from '../checks/http.check.js';

describe('checkHttp', () => {
  it('returns isUp=true and responseTimeMs > 0 for https://example.com', async () => {
    const result = await checkHttp('https://example.com');
    expect(result.isUp).toBe(true);
    expect(result.responseTimeMs).toBeGreaterThan(0);
  }, 15_000);

  it('returns isUp=false for a non-existent URL', async () => {
    const result = await checkHttp('http://this-does-not-exist-xyz.com');
    expect(result.isUp).toBe(false);
  }, 15_000);

  it('always resolves and never throws', async () => {
    await expect(checkHttp('http://this-does-not-exist-xyz.com')).resolves.toBeDefined();
  }, 15_000);
});
