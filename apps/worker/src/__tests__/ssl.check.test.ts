import { describe, it, expect } from 'vitest';
import { checkSsl } from '../checks/ssl.check.js';

describe('checkSsl', () => {
  it('returns a positive expiryDays for https://example.com', async () => {
    const result = await checkSsl('https://example.com');
    expect(result.expiryDays).not.toBeNull();
    expect(result.expiryDays).toBeGreaterThan(0);
  }, 10_000);

  it('returns expiryDays=null without error for http:// URLs', async () => {
    const result = await checkSsl('http://example.com');
    expect(result.expiryDays).toBeNull();
    expect(result.error).toBeUndefined();
  });
});
