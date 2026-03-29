import type { FastifyInstance } from 'fastify';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from '../schemas/auth.schema.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { generateAccessToken, generateRefreshToken } from '../lib/jwt.js';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/register', async (request, reply) => {
    const result = registerSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.errors });
    }
    const { email, password, name } = result.data;

    const existing = await fastify.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(400).send({ error: 'Email already in use' });
    }

    const passwordHash = await hashPassword(password);
    const user = await fastify.prisma.user.create({
      data: { email, passwordHash, name },
    });

    const accessToken = generateAccessToken(fastify, { sub: user.id, email: user.email });
    const refreshToken = generateRefreshToken(fastify, { sub: user.id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await fastify.prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return reply.status(201).send({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    });
  });

  fastify.post('/auth/login', async (request, reply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.errors });
    }
    const { email, password } = result.data;

    const user = await fastify.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(fastify, { sub: user.id, email: user.email });
    const refreshToken = generateRefreshToken(fastify, { sub: user.id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await fastify.prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return reply.send({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    });
  });

  fastify.post('/auth/refresh', async (request, reply) => {
    const result = refreshSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed' });
    }
    const { refreshToken } = result.data;

    const stored = await fastify.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'Invalid or expired refresh token' });
    }

    const accessToken = generateAccessToken(fastify, {
      sub: stored.user.id,
      email: stored.user.email,
    });
    return reply.send({ accessToken });
  });

  fastify.post('/auth/logout', async (request, reply) => {
    const result = logoutSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed' });
    }
    const { refreshToken } = result.data;

    await fastify.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    return reply.send({ success: true });
  });
}
