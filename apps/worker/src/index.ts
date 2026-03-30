import 'dotenv/config';
import { createMonitorWorker } from './workers/monitor.worker.js';
import { syncScheduledJobs } from './jobs/scheduler.js';
import { logger } from './lib/logger.js';

async function main() {
  logger.info('Starting worker...');

  const worker = createMonitorWorker();
  logger.info('Monitor worker created');

  await syncScheduledJobs();
  logger.info('Scheduled jobs synced');

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await worker.close();
    logger.info('Worker closed');
    process.exit(0);
  });

  logger.info('Worker is running');
}

main().catch((err: unknown) => {
  logger.error({ err }, 'Worker startup failed');
  process.exit(1);
});
