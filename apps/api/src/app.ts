import 'dotenv/config';
import Fastify from 'fastify';
import corsPlugin from './plugins/cors.js';
import dbPlugin from './plugins/db.js';
import authPlugin from './plugins/auth.js';
import swaggerPlugin from './plugins/swagger.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import monitorRoutes from './routes/monitors.js';
import notificationRoutes from './routes/notifications.js';
import statusRoutes from './routes/status.js';
import incidentRoutes from './routes/incidents.js';
import userRoutes from './routes/users.js';
import apiKeyRoutes from './routes/apiKeys.js';
import deviceTokenRoutes from './routes/deviceTokens.js';

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
  fastify.register(notificationRoutes);
  fastify.register(statusRoutes);
  fastify.register(incidentRoutes);
  fastify.register(userRoutes);
  fastify.register(apiKeyRoutes);
  fastify.register(deviceTokenRoutes);

  return fastify;
}
