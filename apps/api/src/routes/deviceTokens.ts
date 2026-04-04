import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const deviceTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});

export default async function deviceTokenRoutes(fastify: FastifyInstance) {
  fastify.post('/device-tokens', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const result = deviceTokenSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.errors });
    }
    const { token, platform } = result.data;

    await fastify.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform, updatedAt: new Date() },
      create: { userId, token, platform },
    });

    return reply.status(200).send({ ok: true });
  });
}
