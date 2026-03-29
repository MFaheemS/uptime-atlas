import 'dotenv/config';
import Fastify from 'fastify';
import corsPlugin from './plugins/cors.js';
import dbPlugin from './plugins/db.js';
import authPlugin from './plugins/auth.js';
import swaggerPlugin from './plugins/swagger.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import monitorRoutes from './routes/monitors.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
    },
  });

  await fastify.register(corsPlugin);
  await fastify.register(dbPlugin);
  await fastify.register(authPlugin);
  await fastify.register(swaggerPlugin);

  fastify.register(healthRoutes);
  fastify.register(authRoutes);
  fastify.register(monitorRoutes);

  return fastify;
}
