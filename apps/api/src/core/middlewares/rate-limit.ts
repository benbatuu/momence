import type { MiddlewareHandler } from 'hono';
import { redisConnection } from '../../utils/redis';
import { AppError } from '../errors/app-error';
import { logger } from '../logger';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

// Bellek içi geri dönüş (fallback) haritası
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function createRateLimiter(options: RateLimitOptions): MiddlewareHandler {
  const { windowMs, max, keyPrefix = 'rl' } = options;

  return async (c, next) => {
    // İstemci kimliği: IP veya Authorization başlığı
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      c.req.header('cf-connecting-ip') ||
      'anonymous';

    const key = `${keyPrefix}:${ip}:${c.req.path}`;
    const now = Date.now();
    let currentCount = 0;
    let ttlMs = windowMs;

    try {
      if (redisConnection.status === 'ready') {
        const pipeline = redisConnection.pipeline();
        pipeline.incr(key);
        pipeline.pttl(key);
        const results = await pipeline.exec();

        if (results && results[0] && results[1]) {
          currentCount = results[0][1] as number;
          const remainingTtl = results[1][1] as number;

          if (remainingTtl === -1) {
            await redisConnection.pexpire(key, windowMs);
            ttlMs = windowMs;
          } else {
            ttlMs = remainingTtl;
          }
        }
      } else {
        // Fallback: Bellek içi basit sayaç
        const record = memoryStore.get(key);
        if (!record || now > record.resetAt) {
          memoryStore.set(key, { count: 1, resetAt: now + windowMs });
          currentCount = 1;
        } else {
          record.count += 1;
          currentCount = record.count;
          ttlMs = Math.max(0, record.resetAt - now);
        }
      }
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Rate limiter Redis bağlantı uyarısı, geçişe izin veriliyor');
      return await next();
    }

    const remaining = Math.max(0, max - currentCount);
    const resetSeconds = Math.ceil(ttlMs / 1000);

    c.header('RateLimit-Limit', max.toString());
    c.header('RateLimit-Remaining', remaining.toString());
    c.header('RateLimit-Reset', resetSeconds.toString());

    if (currentCount > max) {
      throw AppError.rateLimit(`Çok fazla istek yapıldı. Lütfen ${resetSeconds} saniye sonra tekrar deneyiniz.`);
    }

    await next();
  };
}
