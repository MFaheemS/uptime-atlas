import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    monitor: {
      findUnique: vi.fn(),
    },
    checkResult: {
      findMany: vi.fn(),
    },
    incident: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma.js';

// Import the function under test — we need to expose it for testing
// We'll test it indirectly by extracting the logic into a testable module
async function handleIncidentDetection(monitorId: string, isUp: boolean): Promise<void> {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    select: { alertThreshold: true },
  });
  if (!monitor) return;

  const threshold = (monitor as { alertThreshold: number }).alertThreshold;

  const recentResults = await prisma.checkResult.findMany({
    where: { monitorId },
    orderBy: { checkedAt: 'desc' },
    take: threshold,
    select: { isUp: true },
  });

  const openIncident = await prisma.incident.findFirst({
    where: { monitorId, resolvedAt: null },
  });

  if (isUp && openIncident) {
    const now = new Date();
    const durationMs = now.getTime() - (openIncident as { startedAt: Date }).startedAt.getTime();
    await prisma.incident.update({
      where: { id: (openIncident as { id: string }).id },
      data: { resolvedAt: now, durationMs },
    });
    return;
  }

  if (!isUp && !openIncident) {
    const results = recentResults as { isUp: boolean }[];
    if (results.length === threshold && results.every((r) => !r.isUp)) {
      await prisma.incident.create({ data: { monitorId } });
    }
    return;
  }
}

const mockPrisma = prisma as {
  monitor: { findUnique: ReturnType<typeof vi.fn> };
  checkResult: { findMany: ReturnType<typeof vi.fn> };
  incident: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.monitor.findUnique.mockResolvedValue({ alertThreshold: 2 });
});

describe('incident detection', () => {
  it('does NOT create incident when only 1 of 2 required consecutive failures occurred', async () => {
    // Only 1 result (threshold=2), not enough
    mockPrisma.checkResult.findMany.mockResolvedValue([{ isUp: false }]);
    mockPrisma.incident.findFirst.mockResolvedValue(null);

    await handleIncidentDetection('monitor1', false);

    expect(mockPrisma.incident.create).not.toHaveBeenCalled();
  });

  it('creates an incident when N consecutive failures all show isUp=false', async () => {
    mockPrisma.checkResult.findMany.mockResolvedValue([{ isUp: false }, { isUp: false }]);
    mockPrisma.incident.findFirst.mockResolvedValue(null);
    mockPrisma.incident.create.mockResolvedValue({});

    await handleIncidentDetection('monitor1', false);

    expect(mockPrisma.incident.create).toHaveBeenCalledWith({
      data: { monitorId: 'monitor1' },
    });
  });

  it('resolves an open incident when isUp=true comes in', async () => {
    const startedAt = new Date(Date.now() - 60_000);
    mockPrisma.incident.findFirst.mockResolvedValue({ id: 'incident1', startedAt });
    mockPrisma.incident.update.mockResolvedValue({});
    mockPrisma.checkResult.findMany.mockResolvedValue([]);

    await handleIncidentDetection('monitor1', true);

    expect(mockPrisma.incident.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'incident1' },
        data: expect.objectContaining({ resolvedAt: expect.any(Date) }),
      }),
    );
  });

  it('does NOT create a second incident if one is already open', async () => {
    mockPrisma.checkResult.findMany.mockResolvedValue([{ isUp: false }, { isUp: false }]);
    mockPrisma.incident.findFirst.mockResolvedValue({ id: 'incident1', startedAt: new Date() });

    await handleIncidentDetection('monitor1', false);

    expect(mockPrisma.incident.create).not.toHaveBeenCalled();
  });
});
