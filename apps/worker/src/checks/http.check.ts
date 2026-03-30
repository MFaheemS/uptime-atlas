import { Agent, interceptors, request } from 'undici';
import type { HttpCheckResult } from '../types/check.types.js';

export async function checkHttp(url: string): Promise<HttpCheckResult> {
  const start = performance.now();
  try {
    const agent = new Agent({
      connect: {
        rejectUnauthorized: process.env['NODE_TLS_REJECT_UNAUTHORIZED'] !== '0',
      },
    }).compose(interceptors.redirect({ maxRedirections: 5 }));

    const response = await request(url, {
      method: 'GET',
      headersTimeout: 10_000,
      bodyTimeout: 10_000,
      dispatcher: agent,
    });

    const end = performance.now();
    const responseTimeMs = Math.round(end - start);
    const statusCode = response.statusCode;
    const isUp = statusCode >= 200 && statusCode <= 399;

    await response.body.dump();
    await agent.close();

    return { isUp, statusCode, responseTimeMs };
  } catch (err) {
    const end = performance.now();
    const responseTimeMs = Math.round(end - start);
    const error = err instanceof Error ? err.message : String(err);
    return { isUp: false, statusCode: 0, responseTimeMs, error };
  }
}
