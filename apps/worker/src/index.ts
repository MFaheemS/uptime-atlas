import 'dotenv/config';
import { createMonitorWorker } from './workers/monitor.worker.js';
import { syncScheduledJobs } from './jobs/scheduler.js';
import { createSlaQueue, createSlaWorker, scheduleSlaJob } from './jobs/sla.job.js';
import { logger } from './lib/logger.js';

async function main() {
  logger.info('Starting worker...');

  const worker = createMonitorWorker();
  logger.info('Monitor worker created');

  const slaQueue = createSlaQueue();
  const slaWorker = createSlaWorker();
  await scheduleSlaJob(slaQueue);
  logger.info('SLA worker created and job scheduled');

  await syncScheduledJobs();
  logger.info('Scheduled jobs synced');

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await worker.close();
    await slaWorker.close();
    await slaQueue.close();
    logger.info('Workers closed');
    process.exit(0);
  });

  logger.info('Worker is running');
}

main().catch((err: unknown) => {
  logger.error({ err }, 'Worker startup failed');
  process.exit(1);
});
