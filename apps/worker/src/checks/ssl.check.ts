import tls from 'tls';
import type { SslCheckResult } from '../types/check.types.js';

export async function checkSsl(url: string): Promise<SslCheckResult> {
  if (url.startsWith('http://')) {
    return { expiryDays: null };
  }

  const hostname = new URL(url).hostname;

  return new Promise<SslCheckResult>((resolve) => {
    let socket: tls.TLSSocket | null = null;
    try {
      socket = tls.connect({ host: hostname, port: 443, servername: hostname }, () => {
        try {
          const cert = socket!.getPeerCertificate();
          const expiryDate = new Date(cert.valid_to);
          const now = Date.now();
          const expiryDays = Math.floor((expiryDate.getTime() - now) / 86_400_000);
          const issuer = cert.issuer?.O;
          socket!.destroy();
          resolve({ expiryDays, issuer });
        } catch (err) {
          socket?.destroy();
          const error = err instanceof Error ? err.message : String(err);
          resolve({ expiryDays: null, error });
        }
      });

      socket.setTimeout(5_000, () => {
        socket?.destroy();
        resolve({ expiryDays: null, error: 'TLS connection timed out' });
      });

      socket.on('error', (err: Error) => {
        socket?.destroy();
        resolve({ expiryDays: null, error: err.message });
      });
    } catch (err) {
      socket?.destroy();
      const error = err instanceof Error ? err.message : String(err);
      resolve({ expiryDays: null, error });
    }
  });
}
