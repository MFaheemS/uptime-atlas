import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../groq.client.js', () => ({
  callGroq: vi.fn(),
}));

import { generateIncidentSummary } from '../incident-summary.js';
import { callGroq } from '../groq.client.js';

const mockCallGroq = vi.mocked(callGroq);

beforeEach(() => {
  vi.clearAllMocks();
});

const incident = {
  startedAt: new Date('2024-01-01T14:32:00Z'),
  resolvedAt: null,
};

const monitor = {
  name: 'api.example.com',
  url: 'https://api.example.com',
};

const checkResults = [
  {
    status: 503,
    responseTimeMs: 1200,
    error: 'Service Unavailable',
    checkedAt: new Date('2024-01-01T14:32:00Z'),
  },
  {
    status: 503,
    responseTimeMs: 1100,
    error: 'Service Unavailable',
    checkedAt: new Date('2024-01-01T14:33:00Z'),
  },
];

describe('generateIncidentSummary', () => {
  it('calls Groq with prompt containing monitor name and URL', async () => {
    mockCallGroq.mockResolvedValueOnce('api.example.com was unreachable for 4 minutes.');
    await generateIncidentSummary(incident, checkResults, monitor);
    expect(mockCallGroq).toHaveBeenCalledOnce();
    const [userPrompt] = mockCallGroq.mock.calls[0] as [string, ...unknown[]];
    expect(userPrompt).toContain('api.example.com');
    expect(userPrompt).toContain('https://api.example.com');
  });

  it('returns null when Groq client returns null', async () => {
    mockCallGroq.mockResolvedValueOnce(null);
    const result = await generateIncidentSummary(incident, checkResults, monitor);
    expect(result).toBeNull();
  });

  it('returns the text content from Groq response', async () => {
    const expected = 'api.example.com was unreachable for 4 minutes starting at 14:32 UTC.';
    mockCallGroq.mockResolvedValueOnce(expected);
    const result = await generateIncidentSummary(incident, checkResults, monitor);
    expect(result).toBe(expected);
  });
});
