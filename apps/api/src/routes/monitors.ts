import type { FastifyInstance } from 'fastify';
import { createMonitorSchema, updateMonitorSchema } from '../schemas/monitor.schema.js';
import { addMonitorJob, removeMonitorJob } from '../lib/queue.js';

export default async function monitorRoutes(fastify: FastifyInstance) {
  fastify.get('/monitors', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const monitors = await fastify.prisma.monitor.findMany({
      where: { userId },
      include: {
        checkResults: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });
    return reply.send(monitors);
  });

  fastify.post('/monitors', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const result = createMonitorSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.errors });
    }
    const userId = (request.user as { sub: string }).sub;
    // Auto-generate slug from name if not provided
    const slug =
      result.data.slug ??
      result.data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
        '-' +
        Math.random().toString(36).slice(2, 6);
    const monitor = await fastify.prisma.monitor.create({
      data: { ...result.data, slug, userId },
    });
    await addMonitorJob(monitor.id, monitor.url, monitor.intervalMinutes);
    return reply.status(201).send(monitor);
  });

  fastify.get('/monitors/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = (request.user as { sub: string }).sub;
    const monitor = await fastify.prisma.monitor.findFirst({
      where: { id, userId },
      include: {
        checkResults: {
          orderBy: { checkedAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!monitor) return reply.status(404).send({ error: 'Monitor not found' });
    return reply.send(monitor);
  });

  fastify.patch('/monitors/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = (request.user as { sub: string }).sub;
    const result = updateMonitorSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.errors });
    }
    const existing = await fastify.prisma.monitor.findFirst({ where: { id, userId } });
    if (!existing) return reply.status(404).send({ error: 'Monitor not found' });

    const monitor = await fastify.prisma.monitor.update({
      where: { id },
      data: result.data,
    });

    const data = result.data;
    if (data.url !== undefined || data.intervalMinutes !== undefined || data.active !== undefined) {
      await removeMonitorJob(id);
      if (monitor.active) {
        await addMonitorJob(monitor.id, monitor.url, monitor.intervalMinutes);
      }
    }

    return reply.send(monitor);
  });

  fastify.delete(
    '/monitors/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { sub: string }).sub;
      const existing = await fastify.prisma.monitor.findFirst({ where: { id, userId } });
      if (!existing) return reply.status(404).send({ error: 'Monitor not found' });

      await fastify.prisma.monitor.delete({ where: { id } });
      await removeMonitorJob(id);
      return reply.send({ success: true });
    },
  );

  fastify.get(
    '/monitors/:id/stats',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { sub: string }).sub;
      const monitor = await fastify.prisma.monitor.findFirst({ where: { id, userId } });
      if (!monitor) return reply.status(404).send({ error: 'Monitor not found' });

      const stats = await fastify.prisma.monitorStats.findMany({
        where: { monitorId: id },
        orderBy: { calculatedAt: 'desc' },
      });
      return reply.send(stats);
    },
  );
}
