import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../lib/password.js';

const updateProfileSchema = z.object({
  name: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const notificationPrefsSchema = z.object({
  alertOnDown: z.boolean(),
  alertOnRecovered: z.boolean(),
  alertOnSslExpiry: z.boolean(),
  weeklyDigestEnabled: z.boolean().optional(),
});

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/users/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreferences: true },
    });
    if (!user) return reply.status(404).send({ error: 'User not found' });
    return reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      notificationPreferences: user.notificationPreferences,
    });
  });

  fastify.patch('/users/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const result = updateProfileSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.errors });
    }
    const user = await fastify.prisma.user.update({
      where: { id: userId },
      data: { name: result.data.name },
    });
    return reply.send({ id: user.id, email: user.email, name: user.name });
  });

  fastify.patch(
    '/users/me/password',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { sub: string }).sub;
      const result = changePasswordSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: 'Validation failed', details: result.error.errors });
      }
      const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      const valid = await verifyPassword(result.data.currentPassword, user.passwordHash);
      if (!valid) return reply.status(400).send({ error: 'Current password is incorrect' });

      const newHash = await hashPassword(result.data.newPassword);
      await fastify.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });
      return reply.send({ success: true });
    },
  );

  fastify.patch(
    '/users/me/notifications',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { sub: string }).sub;
      const result = notificationPrefsSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: 'Validation failed', details: result.error.errors });
      }
      const prefs = await fastify.prisma.notificationPreferences.upsert({
        where: { userId },
        create: { userId, ...result.data },
        update: result.data,
      });
      return reply.send(prefs);
    },
  );

  fastify.delete('/users/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    await fastify.prisma.user.delete({ where: { id: userId } });
    return reply.send({ success: true });
  });
}
