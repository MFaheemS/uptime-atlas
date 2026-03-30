import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { checkHttp } from '../checks/http.check.js';
import { checkSsl } from '../checks/ssl.check.js';
import { checkDns } from '../checks/dns.check.js';

const REGION = process.env['REGION'] ?? 'us-east';

async function handleIncidentDetection(monitorId: string, isUp: boolean): Promise<void> {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    select: { alertThreshold: true },
  });

  if (!monitor) return;

  const threshold = monitor.alertThreshold;

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
    const durationMs = now.getTime() - openIncident.startedAt.getTime();
    await prisma.incident.update({
      where: { id: openIncident.id },
      data: { resolvedAt: now, durationMs },
    });
    logger.info({ monitorId }, 'Incident resolved');
    return;
  }

  if (!isUp && !openIncident) {
    if (recentResults.length === threshold && recentResults.every((r) => !r.isUp)) {
      await prisma.incident.create({ data: { monitorId } });
      logger.info({ monitorId }, 'Incident created');
    }
    return;
  }

  // isUp=false AND openIncident exists — already tracking, do nothing
}

export function createMonitorWorker() {
  const worker = new Worker(
    'monitor-checks',
    async (job) => {
      const { monitorId, url } = job.data as { monitorId: string; url: string };

      logger.info({ monitorId, url }, 'Job started');

      const [http, ssl, dns] = await Promise.all([checkHttp(url), checkSsl(url), checkDns(url)]);

      await prisma.checkResult.create({
        data: {
          monitorId,
          isUp: http.isUp,
          status: http.statusCode,
          responseTimeMs: http.responseTimeMs,
          error: http.error ?? null,
          sslExpiryDays: ssl.expiryDays ?? null,
          dnsResolutionMs: dns.resolutionTimeMs ?? null,
          region: REGION,
        },
      });

      await handleIncidentDetection(monitorId, http.isUp);

      logger.info(
        { monitorId, isUp: http.isUp, responseTimeMs: http.responseTimeMs },
        'Job completed',
      );
    },
    {
      connection: redis,
      concurrency: 10,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Job failed');
  });

  return worker;
}
