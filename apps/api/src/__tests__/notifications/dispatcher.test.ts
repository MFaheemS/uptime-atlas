import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the individual notification modules that dispatcher imports internally.
// We mock 'resend' so that the Resend constructor never throws.
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'mock' }) },
  })),
}));

vi.mock('@slack/webhook', () => ({
  IncomingWebhook: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('undici', () => ({
  request: vi.fn().mockResolvedValue({ statusCode: 200 }),
}));

// Now safe to import
const { dispatchAlert } = await import('@uptime-atlas/shared');

const mockMonitor = { id: 'mon1', name: 'Test Monitor', url: 'https://example.com' };
const mockIncident = {
  startedAt: new Date('2024-01-01T00:00:00Z'),
  resolvedAt: null,
  durationMs: null,
};

function makePrisma(channels: unknown[], recentLog: unknown = null) {
  return {
    notificationChannel: {
      findMany: vi.fn().mockResolvedValue(channels),
    },
    channelAlertLog: {
      findFirst: vi.fn().mockResolvedValue(recentLog),
      create: vi.fn().mockResolvedValue({}),
    },
  } as unknown as Parameters<typeof dispatchAlert>[0];
}

describe('dispatchAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs and returns early when no channels', async () => {
    const prisma = makePrisma([]);
    await expect(
      dispatchAlert(prisma, 'mon1', 'DOWN', { monitor: mockMonitor, incident: mockIncident }),
    ).resolves.toBeUndefined();
    expect(prisma.channelAlertLog.create).not.toHaveBeenCalled();
  });

  it('skips channel if recent log exists (throttle)', async () => {
    const prisma = makePrisma(
      [{ id: 'ch1', monitorId: 'mon1', type: 'EMAIL', target: 'a@b.com', active: true }],
      { id: 'log1' },
    );
    await dispatchAlert(prisma, 'mon1', 'DOWN', { monitor: mockMonitor, incident: mockIncident });
    expect(prisma.channelAlertLog.create).not.toHaveBeenCalled();
  });

  it('sends email and logs for EMAIL channel without throttle', async () => {
    const prisma = makePrisma([
      { id: 'ch1', monitorId: 'mon1', type: 'EMAIL', target: 'a@b.com', active: true },
    ]);
    await dispatchAlert(prisma, 'mon1', 'DOWN', { monitor: mockMonitor, incident: mockIncident });
    expect(prisma.channelAlertLog.create).toHaveBeenCalledWith({
      data: { monitorId: 'mon1', channelId: 'ch1', alertType: 'DOWN' },
    });
  });

  it('sends slack and logs for SLACK channel', async () => {
    const prisma = makePrisma([
      {
        id: 'ch2',
        monitorId: 'mon1',
        type: 'SLACK',
        target: 'https://hooks.slack.com/test',
        active: true,
      },
    ]);
    await dispatchAlert(prisma, 'mon1', 'RECOVERED', {
      monitor: mockMonitor,
      incident: { ...mockIncident, resolvedAt: new Date(), durationMs: 60000 },
    });
    expect(prisma.channelAlertLog.create).toHaveBeenCalledWith({
      data: { monitorId: 'mon1', channelId: 'ch2', alertType: 'RECOVERED' },
    });
  });

  it('sends webhook and logs for WEBHOOK channel', async () => {
    const prisma = makePrisma([
      {
        id: 'ch3',
        monitorId: 'mon1',
        type: 'WEBHOOK',
        target: 'http://localhost:19999/hook',
        active: true,
      },
    ]);
    // SSL_EXPIRY + WEBHOOK calls sendWebhookSslExpiry -> undici.request internally.
    // The undici mock is hoisted via vi.mock('undici') above.
    await expect(
      dispatchAlert(prisma, 'mon1', 'SSL_EXPIRY', {
        monitor: mockMonitor,
        daysRemaining: 14,
      }),
    ).resolves.toBeUndefined();
    // channelAlertLog.create is called after the send (which is fire-and-forget error-safe)
    expect(prisma.channelAlertLog.create).toHaveBeenCalledWith({
      data: { monitorId: 'mon1', channelId: 'ch3', alertType: 'SSL_EXPIRY' },
    });
  });

  it('handles multiple channels in one dispatch', async () => {
    const prisma = makePrisma([
      { id: 'ch1', monitorId: 'mon1', type: 'EMAIL', target: 'a@b.com', active: true },
      {
        id: 'ch2',
        monitorId: 'mon1',
        type: 'SLACK',
        target: 'https://hooks.slack.com/test',
        active: true,
      },
    ]);
    await dispatchAlert(prisma, 'mon1', 'DOWN', { monitor: mockMonitor, incident: mockIncident });
    expect(prisma.channelAlertLog.create).toHaveBeenCalledTimes(2);
  });
});
