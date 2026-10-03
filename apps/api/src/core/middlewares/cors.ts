import { cors } from 'hono/cors';

export const corsPolicyMiddleware = cors({
  origin: (origin) => {
    if (!origin) return '*';

    // Yerel geliştirme ortamları
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.localhost:3000') ||
      origin.endsWith('.localhost:3001') ||
      origin.endsWith('.studio-os.local') ||
      origin.endsWith('.studio-os.com')
    ) {
      return origin;
    }

    return origin;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-Id',
    'X-Tenant-Id',
    'Idempotency-Key',
    'If-Match',
    'x-studio-subdomain',
  ],
  exposeHeaders: [
    'Content-Length',
    'X-Request-Id',
    'X-Tenant-Id',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
  ],
  maxAge: 600,
  credentials: true,
});
