import { buildApp } from './app.js';

async function main() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`UptimeAtlas API running at http://localhost:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
