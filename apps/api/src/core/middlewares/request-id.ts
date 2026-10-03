import type { MiddlewareHandler } from 'hono';

export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
  const incomingId = c.req.header('x-request-id') || c.req.header('X-Request-Id');
  const requestId = incomingId || crypto.randomUUID();

  // İstek bağlamına ekle
  c.set('requestId', requestId);

  // Yanıt başlığına ekle
  c.header('X-Request-Id', requestId);

  await next();
};
