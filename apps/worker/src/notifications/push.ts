import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

const expo = new Expo();

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
  monitorId?: string,
): Promise<void> {
  try {
    if (monitorId) {
      const pref = await prisma.monitorPushPreference.findUnique({
        where: { userId_monitorId: { userId, monitorId } },
      });
      if (pref && !pref.enabled) return;
    }

    const deviceTokens = await prisma.deviceToken.findMany({ where: { userId } });
    if (deviceTokens.length === 0) return;

    const messages: ExpoPushMessage[] = [];
    for (const dt of deviceTokens) {
      if (!Expo.isExpoPushToken(dt.token)) {
        logger.warn({ token: dt.token }, 'Invalid Expo push token, removing');
        await prisma.deviceToken.delete({ where: { id: dt.id } });
        continue;
      }
      messages.push({ to: dt.token, title, body, data });
    }

    if (messages.length === 0) return;

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === 'error') {
          if (ticket.details?.error === 'DeviceNotRegistered') {
            const token = (messages[i] as any).to as string;
            logger.warn({ token }, 'DeviceNotRegistered — removing token');
            await prisma.deviceToken.deleteMany({ where: { token } });
          } else {
            logger.warn({ error: ticket.message }, 'Push notification error');
          }
        }
      }
    }
  } catch (err) {
    logger.error({ err, userId }, 'Failed to send push notification');
  }
}
