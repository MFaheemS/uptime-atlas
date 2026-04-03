import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../groq.client.js', () => ({
  callGroq: vi.fn(),
}));

import { parseSearchQuery } from '../natural-language-search.js';
import { callGroq } from '../groq.client.js';

const mockCallGroq = vi.mocked(callGroq);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('parseSearchQuery', () => {
  it('returns correct filter for "monitors that are down"', async () => {
    mockCallGroq.mockResolvedValueOnce('{"status":"DOWN"}');
    const result = await parseSearchQuery('monitors that are down');
    expect(result).toEqual({ status: 'DOWN' });
  });

  it('returns null when Groq returns invalid JSON', async () => {
    mockCallGroq.mockResolvedValueOnce('this is not json');
    const result = await parseSearchQuery('something');
    expect(result).toBeNull();
  });

  it('returns null when Groq client returns null (simulating internal error/rate limit)', async () => {
    // callGroq catches errors internally and returns null; parseSearchQuery should handle this
    mockCallGroq.mockResolvedValueOnce(null);
    const result = await parseSearchQuery('something');
    expect(result).toBeNull();
  });

  it('returns null when Groq returns null', async () => {
    mockCallGroq.mockResolvedValueOnce(null);
    const result = await parseSearchQuery('something');
    expect(result).toBeNull();
  });
});
