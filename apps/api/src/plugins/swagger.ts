import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';

export default fp(async (fastify: FastifyInstance) => {
  fastify.register(swagger, {
    openapi: {
      info: {
        title: 'UptimeAtlas API',
        version: '1.0.0',
      },
    },
  });

  fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });
});
