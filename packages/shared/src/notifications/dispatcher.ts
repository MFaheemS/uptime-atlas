import type { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger.js';
import { sendDownAlert, sendRecoveredAlert, sendSslExpiryAlert } from './email.js';
import { sendSlackDownAlert, sendSlackRecoveredAlert, sendSlackSslExpiryAlert } from './slack.js';
import { sendWebhookDown, sendWebhookRecovered, sendWebhookSslExpiry } from './webhook.js';
import type { NotificationMonitor, NotificationIncident } from './email.js';

export type AlertType = 'DOWN' | 'RECOVERED' | 'SSL_EXPIRY';

export interface AlertContext {
  monitor: NotificationMonitor;
  incident?: NotificationIncident;
  daysRemaining?: number;
}

const THROTTLE_MINUTES_DEFAULT = 30;
const THROTTLE_MINUTES_SSL = 24 * 60;

export async function dispatchAlert(
  prisma: PrismaClient,
  monitorId: string,
  alertType: AlertType,
  context: AlertContext,
): Promise<void> {
  const channels = await prisma.notificationChannel.findMany({
    where: { monitorId, active: true },
  });

  if (channels.length === 0) {
    logger.info({ monitorId, alertType }, 'No active notification channels');
    return;
  }

  const throttleMinutes =
    alertType === 'SSL_EXPIRY' ? THROTTLE_MINUTES_SSL : THROTTLE_MINUTES_DEFAULT;
  const throttleWindow = new Date(Date.now() - throttleMinutes * 60 * 1000);

  let alerted = 0;
  let skipped = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    channels.map(async (channel) => {
      const recentLog = await prisma.channelAlertLog.findFirst({
        where: {
          channelId: channel.id,
          alertType,
          sentAt: { gte: throttleWindow },
        },
      });

      if (recentLog) {
        logger.info({ monitorId, channelId: channel.id, alertType }, 'Alert throttled — skipping');
        skipped++;
        return;
      }

      const { monitor } = context;

      if (channel.type === 'EMAIL') {
        if (alertType === 'DOWN' && context.incident) {
          await sendDownAlert(channel.target, monitor, context.incident);
        } else if (alertType === 'RECOVERED' && context.incident) {
          await sendRecoveredAlert(channel.target, monitor, context.incident);
        } else if (alertType === 'SSL_EXPIRY' && context.daysRemaining !== undefined) {
          await sendSslExpiryAlert(channel.target, monitor, context.daysRemaining);
        }
      } else if (channel.type === 'SLACK') {
        if (alertType === 'DOWN' && context.incident) {
          await sendSlackDownAlert(channel.target, monitor, context.incident);
        } else if (alertType === 'RECOVERED' && context.incident) {
          await sendSlackRecoveredAlert(channel.target, monitor, context.incident);
        } else if (alertType === 'SSL_EXPIRY' && context.daysRemaining !== undefined) {
          await sendSlackSslExpiryAlert(channel.target, monitor, context.daysRemaining);
        }
      } else if (channel.type === 'WEBHOOK') {
        if (alertType === 'DOWN' && context.incident) {
          await sendWebhookDown(channel.target, monitor, context.incident);
        } else if (alertType === 'RECOVERED' && context.incident) {
          await sendWebhookRecovered(channel.target, monitor, context.incident);
        } else if (alertType === 'SSL_EXPIRY' && context.daysRemaining !== undefined) {
          await sendWebhookSslExpiry(channel.target, monitor, context.daysRemaining);
        }
      }

      await prisma.channelAlertLog.create({
        data: { monitorId, channelId: channel.id, alertType },
      });
      alerted++;
    }),
  );

  results.forEach((result) => {
    if (result.status === 'rejected') {
      failed++;
      logger.error({ err: result.reason, monitorId, alertType }, 'Channel alert failed');
    }
  });

  logger.info({ monitorId, alertType, alerted, skipped, failed }, 'Alert dispatch summary');
}
