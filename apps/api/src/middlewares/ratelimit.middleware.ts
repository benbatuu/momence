import type { Context, Next } from 'hono';
import { redisConnection } from '../utils/redis';
import { errorResponse } from '../utils/response';

interface RateLimitOptions {
  windowMs: number; // Zaman penceresi (milisaniye)
  max: number;      // İzin verilen maksimum istek sayısı
  message?: string;
}

export function rateLimiter(options: RateLimitOptions) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';
    const path = c.req.path;
    const key = `ratelimit:${path}:${ip}`;

    try {
      const current = await redisConnection.incr(key);

      if (current === 1) {
        // Anahtara TTL (son kullanma süresi) ata
        await redisConnection.pexpire(key, options.windowMs);
      }

      if (current > options.max) {
        return errorResponse(
          c,
          options.message || 'Çok fazla istek gönderdiniz. Lütfen bir süre sonra tekrar deneyin.',
          429
        );
      }
    } catch (err) {
      // Redis çökse bile uygulamanın durmaması için (Fail-open)
      console.error('Rate Limiter Hatası:', err);
    }

    await next();
  };
}