import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const channelSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('EMAIL'), target: z.string().email() }),
  z.object({
    type: z.literal('SLACK'),
    target: z
      .string()
      .url()
      .refine((val) => val.startsWith('https://hooks.slack.com/'), {
        message: 'Slack webhook URL must start with https://hooks.slack.com/',
      }),
  }),
  z.object({ type: z.literal('WEBHOOK'), target: z.string().url() }),
]);

const updateChannelSchema = z.object({
  target: z.string().optional(),
  active: z.boolean().optional(),
});

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/monitors/:id/notifications',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { sub: string }).sub;
      const monitor = await fastify.prisma.monitor.findFirst({ where: { id, userId } });
      if (!monitor) return reply.status(404).send({ error: 'Monitor not found' });

      const channels = await fastify.prisma.notificationChannel.findMany({
        where: { monitorId: id },
      });
      return reply.send(channels);
    },
  );

  fastify.post(
    '/monitors/:id/notifications',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { sub: string }).sub;
      const monitor = await fastify.prisma.monitor.findFirst({ where: { id, userId } });
      if (!monitor) return reply.status(404).send({ error: 'Monitor not found' });

      const result = channelSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: 'Validation failed', details: result.error.errors });
      }

      const channel = await fastify.prisma.notificationChannel.create({
        data: { monitorId: id, type: result.data.type, target: result.data.target },
      });
      return reply.status(201).send(channel);
    },
  );

  fastify.patch(
    '/monitors/:id/notifications/:channelId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id, channelId } = request.params as { id: string; channelId: string };
      const userId = (request.user as { sub: string }).sub;
      const monitor = await fastify.prisma.monitor.findFirst({ where: { id, userId } });
      if (!monitor) return reply.status(404).send({ error: 'Monitor not found' });

      const result = updateChannelSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: 'Validation failed', details: result.error.errors });
      }

      const channel = await fastify.prisma.notificationChannel.findFirst({
        where: { id: channelId, monitorId: id },
      });
      if (!channel) return reply.status(404).send({ error: 'Channel not found' });

      const updated = await fastify.prisma.notificationChannel.update({
        where: { id: channelId },
        data: result.data,
      });
      return reply.send(updated);
    },
  );

  fastify.delete(
    '/monitors/:id/notifications/:channelId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id, channelId } = request.params as { id: string; channelId: string };
      const userId = (request.user as { sub: string }).sub;
      const monitor = await fastify.prisma.monitor.findFirst({ where: { id, userId } });
      if (!monitor) return reply.status(404).send({ error: 'Monitor not found' });

      const channel = await fastify.prisma.notificationChannel.findFirst({
        where: { id: channelId, monitorId: id },
      });
      if (!channel) return reply.status(404).send({ error: 'Channel not found' });

      await fastify.prisma.notificationChannel.delete({ where: { id: channelId } });
      return reply.send({ success: true });
    },
  );
}
