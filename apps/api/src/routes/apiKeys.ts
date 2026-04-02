import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { hashPassword } from '../lib/password.js';

const createKeySchema = z.object({
  name: z.string().min(1),
});

export default async function apiKeyRoutes(fastify: FastifyInstance) {
  fastify.get('/api-keys', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const keys = await fastify.prisma.apiKey.findMany({
      where: { userId },
      select: { id: true, name: true, createdAt: true, lastUsedAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(keys);
  });

  fastify.post('/api-keys', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const result = createKeySchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.errors });
    }
    const plainKey = `uptime_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = await hashPassword(plainKey);
    const apiKey = await fastify.prisma.apiKey.create({
      data: { userId, name: result.data.name, keyHash },
    });
    // Return the plain key once — it won't be shown again
    return reply.status(201).send({
      id: apiKey.id,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      key: plainKey,
    });
  });

  fastify.delete(
    '/api-keys/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { sub: string }).sub;
      const { id } = request.params as { id: string };
      const existing = await fastify.prisma.apiKey.findFirst({ where: { id, userId } });
      if (!existing) return reply.status(404).send({ error: 'API key not found' });
      await fastify.prisma.apiKey.delete({ where: { id } });
      return reply.send({ success: true });
    },
  );
}
