export interface HttpCheckResult {
  isUp: boolean;
  statusCode: number;
  responseTimeMs: number;
  error?: string;
  redirectCount?: number;
}

export interface SslCheckResult {
  expiryDays: number | null;
  issuer?: string;
  error?: string;
}

export interface DnsCheckResult {
  resolutionTimeMs: number | null;
  resolvedIp?: string;
  error?: string;
}

export interface FullCheckResult {
  monitorId: string;
  url: string;
  region: string;
  checkedAt: Date;
  http: HttpCheckResult;
  ssl: SslCheckResult;
  dns: DnsCheckResult;
}
