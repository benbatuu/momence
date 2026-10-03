import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { etag } from 'hono/etag';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './config/env';
import { logger } from './core/logger';
import { requestIdMiddleware } from './core/middlewares/request-id';
import { rfc7807ErrorFilter } from './core/middlewares/error-filter';
import { corsPolicyMiddleware } from './core/middlewares/cors';
import { createRateLimiter } from './core/middlewares/rate-limit';

import { createProblemDetails } from './core/errors/problem-details';
import { ErrorCodes } from './core/errors/error-codes';

// Rota modülleri
import { healthRouter } from './modules/health/health.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { meRouter } from './modules/me/me.routes';
import { publicRouter } from './modules/public/public.routes';
import { webhooksRouter } from './modules/webhooks/webhooks.routes';

// OpenAPI Destekli Hono Uygulaması (Global Doğrulama Hook'u ile)
const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success && result.error) {
      const issues = (result.error as any).issues || (result.error as any).errors || [];
      const invalidParams = issues.map((e: any) => ({
        name: (e.path || []).join('.'),
        reason: e.message || 'Geçersiz değer',
      }));
      const requestId = c.get('requestId') || c.req.header('x-request-id') || crypto.randomUUID();
      const problem = createProblemDetails({
        status: 422,
        code: ErrorCodes.VALIDATION_ERROR,
        detail: 'İstek parametreleri veya gövdesi doğrulanamadı',
        instance: c.req.path,
        requestId,
        invalidParams,
      });
      c.header('Content-Type', 'application/problem+json');
      return c.json(problem, 422);
    }
  },
});

// 1. Temel Güvenlik ve Kimlik Ara Katmanları
app.use('*', requestIdMiddleware);
app.use('*', corsPolicyMiddleware);
app.use('*', etag());
app.use('*', secureHeaders());

// 2. Yapılandırılmış İstek Günlükleme (Structured Logging)
app.use('*', async (c, next) => {
  const start = Date.now();
  const requestId = c.get('requestId');
  const { method, path } = c.req;

  logger.debug({ requestId, method, path }, 'HTTP İstek Başladı');

  await next();

  const durationMs = Date.now() - start;
  const status = c.res.status;

  logger.info({ requestId, method, path, status, durationMs }, 'HTTP İstek Tamamlandı');
});

// 3. Genel Hız Sınırlayıcı (Rate Limiter - Redis Destekli)
app.use(
  '/api/*',
  createRateLimiter({
    windowMs: 60000,
    max: 120, // Dakikada 120 istek
    keyPrefix: 'global',
  })
);

// 4. Global RFC 7807 Hata Filtresi
app.onError(rfc7807ErrorFilter);

// 5. 404 Kaynak Bulunamadı Filtresi (RFC 7807 Uyumlu)
app.notFound((c) => {
  const requestId = c.get('requestId');
  c.header('Content-Type', 'application/problem+json');
  return c.json(
    {
      type: 'https://api.studio-os.local/errors/NOT_FOUND',
      title: 'Kaynak Bulunamadı',
      status: 404,
      detail: `İstenen endpoint mevcut değil: ${c.req.method} ${c.req.path}`,
      instance: c.req.path,
      code: 'NOT_FOUND',
      requestId,
      timestamp: new Date().toISOString(),
    },
    404
  );
});

// 6. Altyapı ve Sağlık Kontrolü Uçları (/health, /ready, /status)
app.route('/', healthRouter);

// 7. /v1 Sürümleme Yüzeyleri (Bölüm 10.3)
app.route('/v1/admin', adminRouter);
app.route('/v1/me', meRouter);
app.route('/v1/public', publicRouter);
app.route('/v1/webhooks', webhooksRouter);

// 8. OpenAPI 3.1 Belge Üretimi
app.doc('/doc', {
  openapi: '3.1.0',
  info: {
    title: 'Studio OS API',
    version: '1.0.0',
    description: 'Butik fitness ve wellness stüdyoları için modüler monolit yönetim API dokümantasyonu.',
    contact: {
      name: 'Studio OS Mühendislik Ekibi',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Yerel Geliştirme Sunucusu',
    },
  ],
  security: [{ BearerAuth: [] }],
});

// 9. Swagger UI Arayüzü
app.get('/swagger', swaggerUI({ url: '/doc' }));

logger.info(`🚀 Studio OS API ${env.NODE_ENV} modunda başlatıldı: http://localhost:${env.PORT}`);
logger.info(`📖 OpenAPI Dokümantasyonu (Swagger): http://localhost:${env.PORT}/swagger`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};