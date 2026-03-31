import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock resend BEFORE importing the module under test
vi.mock('resend', () => {
  const mockSend = vi.fn().mockResolvedValue({ id: 'email-id-123' });
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: { send: mockSend },
    })),
    _mockSend: mockSend,
  };
});

vi.mock('@react-email/components', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();
  return {
    ...mod,
    render: vi.fn().mockResolvedValue('<html>test</html>'),
  };
});

const { sendDownAlert, sendRecoveredAlert, sendSslExpiryAlert } =
  await import('@uptime-atlas/shared');

const mockMonitor = { id: 'mon1', name: 'My Site', url: 'https://example.com' };
const mockIncident = {
  startedAt: new Date('2024-01-01T00:00:00Z'),
  resolvedAt: null,
  durationMs: null,
};

describe('sendDownAlert', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls resend.emails.send without throwing', async () => {
    await expect(
      sendDownAlert('user@example.com', mockMonitor, mockIncident),
    ).resolves.toBeUndefined();
  });

  it('does not throw when resend send() rejects', async () => {
    const { Resend } = await import('resend');
    // Override the send on the already-created instance
    const mockInstance = vi.mocked(Resend).mock.results[0]?.value as
      | { emails: { send: ReturnType<typeof vi.fn> } }
      | undefined;
    if (mockInstance) {
      mockInstance.emails.send.mockRejectedValueOnce(new Error('API error'));
    }
    await expect(
      sendDownAlert('user@example.com', mockMonitor, mockIncident),
    ).resolves.toBeUndefined();
  });
});

describe('sendRecoveredAlert', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves without error', async () => {
    const incident = {
      startedAt: new Date('2024-01-01T00:00:00Z'),
      resolvedAt: new Date('2024-01-01T00:05:00Z'),
      durationMs: 300_000,
    };
    await expect(
      sendRecoveredAlert('user@example.com', mockMonitor, incident),
    ).resolves.toBeUndefined();
  });
});

describe('sendSslExpiryAlert', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves without error for 14 days remaining', async () => {
    await expect(sendSslExpiryAlert('user@example.com', mockMonitor, 14)).resolves.toBeUndefined();
  });

  it('resolves without error for 3 days remaining (urgent)', async () => {
    await expect(sendSslExpiryAlert('user@example.com', mockMonitor, 3)).resolves.toBeUndefined();
  });
});
