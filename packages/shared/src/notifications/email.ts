import { Resend } from 'resend';
import { render } from '@react-email/components';
import * as React from 'react';
import { DownEmail, downEmailSubject } from './templates/down.email.js';
import { RecoveredEmail, recoveredEmailSubject } from './templates/recovered.email.js';
import { SslExpiryEmail, sslExpiryEmailSubject } from './templates/ssl-expiry.email.js';
import { logger } from '../lib/logger.js';

// Lazily initialize Resend so module can be imported in test environments
// without a real API key being present at module load time.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env['RESEND_API_KEY']);
  }
  return _resend;
}

const fromEmail = process.env['RESEND_FROM_EMAIL'] ?? 'onboarding@resend.dev';
const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';

export interface NotificationMonitor {
  id: string;
  name: string;
  url: string;
}

export interface NotificationIncident {
  startedAt: Date;
  resolvedAt?: Date | null;
  durationMs?: number | null;
}

export async function sendDownAlert(
  toEmail: string,
  monitor: NotificationMonitor,
  incident: NotificationIncident,
): Promise<void> {
  try {
    const html = await render(
      React.createElement(DownEmail, {
        monitorName: monitor.name,
        url: monitor.url,
        startedAt: incident.startedAt,
        monitorId: monitor.id,
        appUrl,
      }),
    );
    await getResend().emails.send({
      from: fromEmail,
      to: toEmail,
      subject: downEmailSubject(monitor.name),
      html,
    });
    logger.info({ monitorId: monitor.id, to: toEmail }, 'Down alert email sent');
  } catch (err) {
    logger.error({ err, monitorId: monitor.id, to: toEmail }, 'Failed to send down alert email');
  }
}

export async function sendRecoveredAlert(
  toEmail: string,
  monitor: NotificationMonitor,
  incident: NotificationIncident,
): Promise<void> {
  try {
    const html = await render(
      React.createElement(RecoveredEmail, {
        monitorName: monitor.name,
        url: monitor.url,
        startedAt: incident.startedAt,
        recoveredAt: incident.resolvedAt ?? new Date(),
        durationMs: incident.durationMs ?? 0,
      }),
    );
    await getResend().emails.send({
      from: fromEmail,
      to: toEmail,
      subject: recoveredEmailSubject(monitor.name),
      html,
    });
    logger.info({ monitorId: monitor.id, to: toEmail }, 'Recovery alert email sent');
  } catch (err) {
    logger.error(
      { err, monitorId: monitor.id, to: toEmail },
      'Failed to send recovery alert email',
    );
  }
}

export async function sendSslExpiryAlert(
  toEmail: string,
  monitor: NotificationMonitor,
  daysRemaining: number,
): Promise<void> {
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysRemaining);
    const html = await render(
      React.createElement(SslExpiryEmail, {
        monitorName: monitor.name,
        url: monitor.url,
        daysRemaining,
        expiryDate,
      }),
    );
    await getResend().emails.send({
      from: fromEmail,
      to: toEmail,
      subject: sslExpiryEmailSubject(daysRemaining, monitor.name),
      html,
    });
    logger.info({ monitorId: monitor.id, to: toEmail }, 'SSL expiry alert email sent');
  } catch (err) {
    logger.error(
      { err, monitorId: monitor.id, to: toEmail },
      'Failed to send SSL expiry alert email',
    );
  }
}
