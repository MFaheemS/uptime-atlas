import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock undici at module level - hoisted by vitest
vi.mock('undici', () => ({
  request: vi.fn().mockResolvedValue({ statusCode: 200 }),
}));

// Import shared AFTER mocks are declared
const sharedModule = await import('@uptime-atlas/shared');
const { sendWebhookDown, sendWebhookRecovered, sendWebhookSslExpiry, sendWebhook } = sharedModule;

const mockMonitor = { id: 'mon1', name: 'My Site', url: 'https://example.com' };
const mockIncident = {
  startedAt: new Date('2024-01-01T00:00:00Z'),
  resolvedAt: null,
  durationMs: null,
};

describe('sendWebhook', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves without error on success', async () => {
    await expect(
      sendWebhook('https://target.com/hook', 'monitor.down', { foo: 'bar' }),
    ).resolves.toBeUndefined();
  });

  it('resolves without error when request throws (graceful error handling)', async () => {
    // Temporarily override undici mock to throw
    const undiciMod = await import('undici');
    vi.mocked(undiciMod.request).mockRejectedValueOnce(new Error('Network error'));
    await expect(
      sendWebhook('https://target.com/hook', 'monitor.down', {}),
    ).resolves.toBeUndefined();
  });
});

describe('sendWebhookDown', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves without error', async () => {
    await expect(
      sendWebhookDown('https://target.com/hook', mockMonitor, mockIncident),
    ).resolves.toBeUndefined();
  });

  it('resolves when optional statusCode and error provided', async () => {
    await expect(
      sendWebhookDown('https://target.com/hook', mockMonitor, mockIncident, 503, 'timeout'),
    ).resolves.toBeUndefined();
  });
});

describe('sendWebhookRecovered', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves without error', async () => {
    const incident = { startedAt: new Date(), resolvedAt: new Date(), durationMs: 60_000 };
    await expect(
      sendWebhookRecovered('https://target.com/hook', mockMonitor, incident),
    ).resolves.toBeUndefined();
  });
});

describe('sendWebhookSslExpiry', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves without error', async () => {
    await expect(
      sendWebhookSslExpiry('https://target.com/hook', mockMonitor, 20),
    ).resolves.toBeUndefined();
  });
});
