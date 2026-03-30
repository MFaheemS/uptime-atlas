import { Queue } from 'bullmq';
import { redis } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export const monitorQueue = new Queue('monitor-checks', { connection: redis });

export async function addMonitorJob(
  monitorId: string,
  url: string,
  intervalMinutes: number,
): Promise<void> {
  const jobId = `monitor:${monitorId}`;
  await monitorQueue.add(
    'check',
    { monitorId, url },
    {
      jobId,
      repeat: { every: intervalMinutes * 60 * 1000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );
}

export async function removeMonitorJob(monitorId: string): Promise<void> {
  const jobId = `monitor:${monitorId}`;
  const repeatableJobs = await monitorQueue.getRepeatableJobs();
  const job = repeatableJobs.find((j) => j.id === jobId || j.key.includes(monitorId));
  if (job) {
    await monitorQueue.removeRepeatableByKey(job.key);
    logger.info({ monitorId }, 'Removed repeatable job');
  }
}

export async function syncScheduledJobs(): Promise<void> {
  const monitors = await prisma.monitor.findMany({ where: { active: true } });
  logger.info({ count: monitors.length }, 'Syncing scheduled jobs');
  for (const monitor of monitors) {
    await addMonitorJob(monitor.id, monitor.url, monitor.intervalMinutes);
  }
}
