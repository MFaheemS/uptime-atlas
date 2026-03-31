import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export async function runSlaJob(): Promise<void> {
  const monitors = await prisma.monitor.findMany({
    where: { active: true },
    select: { id: true },
  });

  for (const monitor of monitors) {
    for (const days of [1, 7, 30]) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const results = await prisma.checkResult.findMany({
        where: { monitorId: monitor.id, checkedAt: { gte: since } },
        select: { isUp: true, responseTimeMs: true },
      });

      const totalChecks = results.length;
      const uptimePercent =
        totalChecks === 0
          ? 100.0
          : Math.round((results.filter((r) => r.isUp).length / totalChecks) * 10000) / 100;
      const avgResponseTimeMs =
        totalChecks === 0 ? 0 : results.reduce((sum, r) => sum + r.responseTimeMs, 0) / totalChecks;

      const totalIncidents = await prisma.incident.count({
        where: { monitorId: monitor.id, startedAt: { gte: since } },
      });

      await prisma.monitorStats.upsert({
        where: {
          monitorId_periodDays: { monitorId: monitor.id, periodDays: days },
        },
        create: {
          monitorId: monitor.id,
          periodDays: days,
          uptimePercent,
          totalChecks,
          totalIncidents,
          avgResponseTimeMs,
        },
        update: {
          uptimePercent,
          totalChecks,
          totalIncidents,
          avgResponseTimeMs,
          calculatedAt: new Date(),
        },
      });
    }
  }

  logger.info({ monitorCount: monitors.length }, 'SLA stats calculated');
}

const SLA_QUEUE_NAME = 'sla-calculations';

export function createSlaQueue(): Queue {
  return new Queue(SLA_QUEUE_NAME, { connection: redis });
}

export function createSlaWorker(): Worker {
  return new Worker(
    SLA_QUEUE_NAME,
    async () => {
      await runSlaJob();
    },
    { connection: redis },
  );
}

export async function scheduleSlaJob(queue: Queue): Promise<void> {
  await queue.add(
    'daily-sla',
    {},
    {
      repeat: { pattern: '0 0 * * *' },
      removeOnComplete: 10,
      removeOnFail: 10,
    },
  );
  logger.info('SLA repeating job scheduled');
}
