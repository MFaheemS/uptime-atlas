import { Queue, Worker } from 'bullmq';
import { Resend } from 'resend';
import { redis } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { generateWeeklyDigest } from '@uptime-atlas/shared';

const DIGEST_QUEUE_NAME = 'weekly-digest';

const resend = new Resend(process.env['RESEND_API_KEY']);
const FROM_EMAIL = process.env['RESEND_FROM_EMAIL'] ?? 'onboarding@resend.dev';

async function runWeeklyDigestForUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationPreferences: true },
  });
  if (!user) return;
  if (user.notificationPreferences?.weeklyDigestEnabled === false) return;

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const monitors = await prisma.monitor.findMany({
    where: { userId },
    include: {
      stats: { where: { periodDays: 7 }, orderBy: { calculatedAt: 'desc' }, take: 1 },
      checkResults: {
        where: { checkedAt: { gte: since7d } },
        select: { sslExpiryDays: true },
      },
    },
  });

  if (monitors.length === 0) return;

  const totalMonitors = monitors.length;
  const incidentCount = await prisma.incident.count({
    where: { monitorId: { in: monitors.map((m) => m.id) }, startedAt: { gte: since7d } },
  });

  // Collect per-monitor avg response times from stats
  const monitorsWithAvg = monitors
    .map((m) => ({
      name: m.name,
      avgResponseTimeMs: m.stats[0]?.avgResponseTimeMs ?? 0,
    }))
    .filter((m) => m.avgResponseTimeMs > 0);

  const slowestMonitor =
    monitorsWithAvg.length > 0
      ? monitorsWithAvg.reduce((a, b) => (a.avgResponseTimeMs > b.avgResponseTimeMs ? a : b))
      : null;
  const fastestMonitor =
    monitorsWithAvg.length > 0
      ? monitorsWithAvg.reduce((a, b) => (a.avgResponseTimeMs < b.avgResponseTimeMs ? a : b))
      : null;

  const overallUptimePercent =
    monitors.length > 0
      ? monitors.reduce((sum, m) => sum + (m.stats[0]?.uptimePercent ?? 100), 0) / monitors.length
      : 100;

  // Collect expiring SSL certs
  const expiringCerts: string[] = [];
  for (const m of monitors) {
    const minExpiry = m.checkResults
      .map((r) => r.sslExpiryDays)
      .filter((d): d is number => d !== null && d <= 30);
    if (minExpiry.length > 0) expiringCerts.push(m.name);
  }

  const weeklyStats = {
    totalMonitors,
    overallUptimePercent,
    incidentCount,
    slowestMonitor,
    fastestMonitor,
    expiringCerts,
  };

  const aiBody = await generateWeeklyDigest(user, weeklyStats);

  const emailBody =
    aiBody ??
    `Hi ${user.name ?? user.email},\n\nHere's your weekly monitoring summary:\n\n` +
      `- Monitors: ${totalMonitors}\n` +
      `- Overall uptime: ${overallUptimePercent.toFixed(2)}%\n` +
      `- Incidents this week: ${incidentCount}\n` +
      (expiringCerts.length > 0
        ? `- SSL expiring soon: ${expiringCerts.join(', ')}\n`
        : '- No SSL certs expiring soon.\n') +
      '\nStay on top of your monitoring!\n\nUptimeAtlas';

  await resend.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: 'Your Weekly Monitoring Digest',
    text: emailBody,
  });

  logger.info({ userId, email: user.email }, 'Weekly digest sent');
}

async function runWeeklyDigestJob(): Promise<void> {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    try {
      await runWeeklyDigestForUser(user.id);
    } catch (err) {
      logger.warn({ err, userId: user.id }, 'Failed to send weekly digest for user');
    }
  }
  logger.info({ userCount: users.length }, 'Weekly digest job completed');
}

export function createDigestQueue(): Queue {
  return new Queue(DIGEST_QUEUE_NAME, { connection: redis });
}

export function createDigestWorker(): Worker {
  return new Worker(
    DIGEST_QUEUE_NAME,
    async () => {
      await runWeeklyDigestJob();
    },
    { connection: redis },
  );
}

export async function scheduleDigestJob(queue: Queue): Promise<void> {
  await queue.add(
    'weekly-digest',
    {},
    {
      repeat: { pattern: '0 8 * * 1' }, // Every Monday at 08:00 UTC
      removeOnComplete: 10,
      removeOnFail: 10,
    },
  );
  logger.info('Weekly digest repeating job scheduled');
}
