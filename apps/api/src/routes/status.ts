import type { FastifyInstance } from 'fastify';

export default async function statusRoutes(fastify: FastifyInstance) {
  fastify.get('/status/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const monitor = await fastify.prisma.monitor.findUnique({
      where: { slug },
      include: {
        checkResults: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
        incidents: {
          where: { resolvedAt: { not: null } },
          orderBy: { resolvedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!monitor) return reply.status(404).send({ error: 'Status page not found' });

    // Build daily uptime for last 90 days
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const checks = await fastify.prisma.checkResult.findMany({
      where: { monitorId: monitor.id, checkedAt: { gte: ninetyDaysAgo } },
      select: { checkedAt: true, isUp: true },
      orderBy: { checkedAt: 'asc' },
    });

    // Group checks by day
    const dayMap: Record<string, { up: number; total: number }> = {};
    for (const c of checks) {
      const day = c.checkedAt.toISOString().slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { up: 0, total: 0 };
      dayMap[day].total++;
      if (c.isUp) dayMap[day].up++;
    }

    const dailyUptime = Array.from({ length: 90 }, (_, i) => {
      const d = new Date(now.getTime() - (89 - i) * 24 * 60 * 60 * 1000);
      const day = d.toISOString().slice(0, 10);
      const entry = dayMap[day];
      return {
        date: day,
        uptime: entry ? (entry.up / entry.total) * 100 : null,
      };
    });

    // 30d uptime percent
    const checks30 = checks.filter((c) => c.checkedAt >= thirtyDaysAgo);
    const uptime30d =
      checks30.length > 0 ? (checks30.filter((c) => c.isUp).length / checks30.length) * 100 : null;

    const lastCheck = monitor.checkResults[0];
    const currentStatus = lastCheck ? (lastCheck.isUp ? 'up' : 'down') : 'unknown';

    const resolvedIncidents = monitor.incidents.map((inc) => ({
      id: inc.id,
      startedAt: inc.startedAt,
      resolvedAt: inc.resolvedAt,
      durationMs: inc.durationMs,
      aiSummary: inc.aiSummary,
    }));

    return reply.send({
      name: monitor.name,
      slug: monitor.slug,
      status: currentStatus,
      uptime30d,
      dailyUptime,
      resolvedIncidents,
    });
  });
}
