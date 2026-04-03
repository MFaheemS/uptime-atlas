import type { FastifyInstance } from 'fastify';
import { callGroq } from '@uptime-atlas/shared';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  fastify.get('/health/ai', async () => {
    const result = await callGroq('Reply with the word OK', 'Reply with only the word OK.', 5, 0.0);
    const active = result !== null;
    return {
      status: active ? 'ok' : 'unavailable',
      aiFeatures: active ? 'active' : 'unavailable',
      timestamp: new Date().toISOString(),
    };
  });
}
