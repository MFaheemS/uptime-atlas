import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { checkHttp } from '../checks/http.check.js';
import { checkSsl } from '../checks/ssl.check.js';
import { checkDns } from '../checks/dns.check.js';
import { dispatchAlert } from '@uptime-atlas/shared';
import { generateIncidentSummary } from '@uptime-atlas/shared';
import { detectAnomaly } from '@uptime-atlas/shared';

const REGION = process.env['REGION'] ?? 'us-east';

async function handleIncidentDetection(monitorId: string, isUp: boolean): Promise<void> {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    select: { alertThreshold: true, id: true, name: true, url: true },
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
    const resolved = await prisma.incident.update({
      where: { id: openIncident.id },
      data: { resolvedAt: now, durationMs },
    });
    logger.info({ monitorId }, 'Incident resolved');
    await dispatchAlert(prisma, monitorId, 'RECOVERED', {
      monitor,
      incident: resolved,
    });
    return;
  }

  if (!isUp && !openIncident) {
    if (recentResults.length === threshold && recentResults.every((r) => !r.isUp)) {
      const incident = await prisma.incident.create({ data: { monitorId } });
      logger.info({ monitorId }, 'Incident created');
      await dispatchAlert(prisma, monitorId, 'DOWN', {
        monitor,
        incident,
      });

      // Generate AI summary asynchronously — do not block the job
      setImmediate(() => {
        void (async () => {
          try {
            const checkResults = await prisma.checkResult.findMany({
              where: { monitorId },
              orderBy: { checkedAt: 'desc' },
              take: 10,
              select: { status: true, responseTimeMs: true, error: true, checkedAt: true },
            });
            const summary = await generateIncidentSummary(incident, checkResults, monitor);
            if (summary) {
              await prisma.incident.update({
                where: { id: incident.id },
                data: { aiSummary: summary },
              });
              logger.info({ monitorId, incidentId: incident.id }, 'AI summary saved');
            }
          } catch (err) {
            logger.warn({ err, monitorId }, 'Failed to generate AI incident summary');
          }
        })();
      });
    }
    return;
  }

  // isUp=false AND openIncident exists — already tracking, do nothing
}

async function handleAnomalyDetection(
  monitorId: string,
  checkResultId: string,
  responseTimeMs: number,
): Promise<void> {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentResults = await prisma.checkResult.findMany({
      where: { monitorId, checkedAt: { gte: since24h } },
      select: { responseTimeMs: true },
    });

    const anomaly = detectAnomaly(responseTimeMs, recentResults);
    if (anomaly.isAnomaly) {
      const values = recentResults.map((r) => r.responseTimeMs);
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      await prisma.anomalyEvent.create({
        data: {
          monitorId,
          checkResultId,
          zScore: anomaly.zScore,
          responseTimeMs,
          meanResponseTimeMs: mean,
        },
      });
      logger.info(
        { monitorId, zScore: anomaly.zScore, message: anomaly.message },
        'Anomaly detected',
      );
    }
  } catch (err) {
    logger.warn({ err, monitorId }, 'Anomaly detection failed');
  }
}

export function createMonitorWorker() {
  const worker = new Worker(
    'monitor-checks',
    async (job) => {
      const { monitorId, url } = job.data as { monitorId: string; url: string };

      logger.info({ monitorId, url }, 'Job started');

      const [http, ssl, dns] = await Promise.all([checkHttp(url), checkSsl(url), checkDns(url)]);

      const checkResult = await prisma.checkResult.create({
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
      await handleAnomalyDetection(monitorId, checkResult.id, http.responseTimeMs);

      if (ssl.expiryDays !== null && ssl.expiryDays !== undefined && ssl.expiryDays <= 30) {
        const monitor = await prisma.monitor.findUnique({
          where: { id: monitorId },
          select: { id: true, name: true, url: true },
        });
        if (monitor) {
          await dispatchAlert(prisma, monitorId, 'SSL_EXPIRY', {
            monitor,
            daysRemaining: ssl.expiryDays,
          });
        }
      }

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
