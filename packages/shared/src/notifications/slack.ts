import { IncomingWebhook } from '@slack/webhook';
import { logger } from '../lib/logger.js';
import type { NotificationMonitor, NotificationIncident } from './email.js';

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} seconds`;
  return `${minutes} minutes ${seconds} seconds`;
}

export async function sendSlackDownAlert(
  webhookUrl: string,
  monitor: NotificationMonitor,
  incident: NotificationIncident,
): Promise<void> {
  try {
    const webhook = new IncomingWebhook(webhookUrl);
    await webhook.send({
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🔴 Monitor Down', emoji: true },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Monitor:*\n${monitor.name}` },
            { type: 'mrkdwn', text: `*URL:*\n${monitor.url}` },
            { type: 'mrkdwn', text: `*Down since:*\n${incident.startedAt.toISOString()}` },
          ],
        },
      ],
    });
    logger.info({ monitorId: monitor.id }, 'Slack down alert sent');
  } catch (err) {
    logger.error({ err, monitorId: monitor.id }, 'Failed to send Slack down alert');
  }
}

export async function sendSlackRecoveredAlert(
  webhookUrl: string,
  monitor: NotificationMonitor,
  incident: NotificationIncident,
): Promise<void> {
  try {
    const webhook = new IncomingWebhook(webhookUrl);
    await webhook.send({
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🟢 Monitor Recovered', emoji: true },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Monitor:*\n${monitor.name}` },
            { type: 'mrkdwn', text: `*URL:*\n${monitor.url}` },
            {
              type: 'mrkdwn',
              text: `*Total downtime:*\n${formatDuration(incident.durationMs ?? 0)}`,
            },
          ],
        },
      ],
    });
    logger.info({ monitorId: monitor.id }, 'Slack recovery alert sent');
  } catch (err) {
    logger.error({ err, monitorId: monitor.id }, 'Failed to send Slack recovery alert');
  }
}

export async function sendSlackSslExpiryAlert(
  webhookUrl: string,
  monitor: NotificationMonitor,
  daysRemaining: number,
): Promise<void> {
  try {
    const webhook = new IncomingWebhook(webhookUrl);
    await webhook.send({
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '⚠️ SSL Certificate Expiring', emoji: true },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Monitor:*\n${monitor.name}` },
            { type: 'mrkdwn', text: `*URL:*\n${monitor.url}` },
            { type: 'mrkdwn', text: `*Days remaining:*\n${daysRemaining}` },
          ],
        },
      ],
    });
    logger.info({ monitorId: monitor.id }, 'Slack SSL expiry alert sent');
  } catch (err) {
    logger.error({ err, monitorId: monitor.id }, 'Failed to send Slack SSL expiry alert');
  }
}
