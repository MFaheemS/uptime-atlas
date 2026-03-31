import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before import
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    monitor: {
      findMany: vi.fn(),
    },
    checkResult: {
      findMany: vi.fn(),
    },
    incident: {
      count: vi.fn(),
    },
    monitorStats: {
      upsert: vi.fn(),
    },
  },
}));

const { calculateUptimePercent, runSlaJob } = await import('../../jobs/sla.job.js');
const { prisma } = await import('../../lib/prisma.js');

describe('calculateUptimePercent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 100 when no results', async () => {
    vi.mocked(prisma.checkResult.findMany).mockResolvedValue([]);
    const result = await calculateUptimePercent('mon1', 7);
    expect(result).toBe(100.0);
  });

  it('returns correct uptime for all up', async () => {
    vi.mocked(prisma.checkResult.findMany).mockResolvedValue([
      { isUp: true } as never,
      { isUp: true } as never,
      { isUp: true } as never,
    ]);
    const result = await calculateUptimePercent('mon1', 7);
    expect(result).toBe(100.0);
  });

  it('returns correct uptime for mixed results', async () => {
    vi.mocked(prisma.checkResult.findMany).mockResolvedValue([
      { isUp: true } as never,
      { isUp: true } as never,
      { isUp: false } as never,
      { isUp: false } as never,
    ]);
    const result = await calculateUptimePercent('mon1', 7);
    expect(result).toBe(50.0);
  });

  it('rounds to 2 decimal places', async () => {
    const results = Array.from({ length: 3 }, (_, i) => ({ isUp: i < 2 }) as never);
    vi.mocked(prisma.checkResult.findMany).mockResolvedValue(results);
    const result = await calculateUptimePercent('mon1', 7);
    expect(result).toBe(66.67);
  });
});

describe('runSlaJob', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does nothing when no active monitors', async () => {
    vi.mocked(prisma.monitor.findMany).mockResolvedValue([]);
    await runSlaJob();
    expect(prisma.monitorStats.upsert).not.toHaveBeenCalled();
  });

  it('upserts stats for 3 periods (1, 7, 30 days) per monitor', async () => {
    vi.mocked(prisma.monitor.findMany).mockResolvedValue([{ id: 'mon1' } as never]);
    vi.mocked(prisma.checkResult.findMany).mockResolvedValue([
      { isUp: true, responseTimeMs: 200 } as never,
    ]);
    vi.mocked(prisma.incident.count).mockResolvedValue(0);
    vi.mocked(prisma.monitorStats.upsert).mockResolvedValue({} as never);

    await runSlaJob();
    expect(prisma.monitorStats.upsert).toHaveBeenCalledTimes(3); // 1, 7, 30 days
  });

  it('calculates correct avg response time', async () => {
    vi.mocked(prisma.monitor.findMany).mockResolvedValue([{ id: 'mon1' } as never]);
    vi.mocked(prisma.checkResult.findMany).mockResolvedValue([
      { isUp: true, responseTimeMs: 100 } as never,
      { isUp: true, responseTimeMs: 300 } as never,
    ]);
    vi.mocked(prisma.incident.count).mockResolvedValue(1);
    vi.mocked(prisma.monitorStats.upsert).mockResolvedValue({} as never);

    await runSlaJob();

    const firstCall = vi.mocked(prisma.monitorStats.upsert).mock.calls[0];
    expect(firstCall?.[0].create.avgResponseTimeMs).toBe(200);
    expect(firstCall?.[0].create.totalIncidents).toBe(1);
  });

  it('sets 100% uptime and 0 avg response when no check results', async () => {
    vi.mocked(prisma.monitor.findMany).mockResolvedValue([{ id: 'mon1' } as never]);
    vi.mocked(prisma.checkResult.findMany).mockResolvedValue([]);
    vi.mocked(prisma.incident.count).mockResolvedValue(0);
    vi.mocked(prisma.monitorStats.upsert).mockResolvedValue({} as never);

    await runSlaJob();

    const firstCall = vi.mocked(prisma.monitorStats.upsert).mock.calls[0];
    expect(firstCall?.[0].create.uptimePercent).toBe(100.0);
    expect(firstCall?.[0].create.avgResponseTimeMs).toBe(0);
  });
});
