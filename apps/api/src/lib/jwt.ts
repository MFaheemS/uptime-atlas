import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

export function generateAccessToken(fastify: FastifyInstance, payload: object): string {
  return fastify.jwt.sign({ ...payload, jti: randomUUID() }, { expiresIn: '15m' });
}

export function generateRefreshToken(fastify: FastifyInstance, payload: object): string {
  return fastify.jwt.sign({ ...payload, jti: randomUUID() }, { expiresIn: '30d' });
}
