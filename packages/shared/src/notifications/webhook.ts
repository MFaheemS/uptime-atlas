import { request } from 'undici';
import { logger } from '../lib/logger.js';
import type { NotificationMonitor, NotificationIncident } from './email.js';

type WebhookEvent = 'monitor.down' | 'monitor.recovered' | 'ssl.expiring';

export async function sendWebhook(
  targetUrl: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const body = JSON.stringify({ event, ...payload });
    const { statusCode } = await request(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'UptimeAtlas-Webhook/1.0',
      },
      body,
      bodyTimeout: 10_000,
      headersTimeout: 10_000,
    });
    logger.info({ targetUrl, event, statusCode }, 'Webhook sent');
  } catch (err) {
    logger.error({ err, targetUrl, event }, 'Failed to send webhook');
  }
}

export async function sendWebhookDown(
  targetUrl: string,
  monitor: NotificationMonitor,
  incident: NotificationIncident,
  statusCode?: number,
  error?: string,
): Promise<void> {
  await sendWebhook(targetUrl, 'monitor.down', {
    monitorId: monitor.id,
    monitorName: monitor.name,
    url: monitor.url,
    timestamp: incident.startedAt.toISOString(),
    statusCode,
    ...(error !== undefined ? { error } : {}),
  });
}

export async function sendWebhookRecovered(
  targetUrl: string,
  monitor: NotificationMonitor,
  incident: NotificationIncident,
): Promise<void> {
  await sendWebhook(targetUrl, 'monitor.recovered', {
    monitorId: monitor.id,
    monitorName: monitor.name,
    url: monitor.url,
    timestamp: new Date().toISOString(),
    durationMs: incident.durationMs ?? 0,
  });
}

export async function sendWebhookSslExpiry(
  targetUrl: string,
  monitor: NotificationMonitor,
  daysRemaining: number,
): Promise<void> {
  await sendWebhook(targetUrl, 'ssl.expiring', {
    monitorId: monitor.id,
    monitorName: monitor.name,
    url: monitor.url,
    expiryDays: daysRemaining,
    timestamp: new Date().toISOString(),
  });
}
