import type { FastifyInstance } from 'fastify';

export default async function incidentRoutes(fastify: FastifyInstance) {
  fastify.get('/incidents', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const query = request.query as {
      monitorId?: string;
      status?: 'open' | 'resolved';
      page?: string;
    };

    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const pageSize = 20;

    const userMonitors = await fastify.prisma.monitor.findMany({
      where: { userId },
      select: { id: true },
    });
    const monitorIds = userMonitors.map((m) => m.id);

    const where: any = { monitorId: { in: monitorIds } };
    if (query.monitorId) where.monitorId = query.monitorId;
    if (query.status === 'open') where.resolvedAt = null;
    if (query.status === 'resolved') where.resolvedAt = { not: null };

    const [total, incidents] = await Promise.all([
      fastify.prisma.incident.count({ where }),
      fastify.prisma.incident.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          monitor: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Fetch check results during each incident
    const incidentsWithChecks = await Promise.all(
      incidents.map(async (inc) => {
        const checks = await fastify.prisma.checkResult.findMany({
          where: {
            monitorId: inc.monitorId,
            checkedAt: {
              gte: inc.startedAt,
              ...(inc.resolvedAt ? { lte: inc.resolvedAt } : {}),
            },
          },
          orderBy: { checkedAt: 'asc' },
          take: 50,
        });
        return { ...inc, checkResults: checks };
      }),
    );

    return reply.send({
      incidents: incidentsWithChecks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  });
}
