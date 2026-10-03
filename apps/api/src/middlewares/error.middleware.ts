import type { Context } from 'hono';
import { errorResponse } from '../utils/response';
import { LoggerService } from '../utils/logger';

export async function globalErrorHandler(err: Error, c: Context) {
  const user = c.get('user');
  const studioId = c.get('studioId');

  let body = null;
  try {
    if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
      body = await c.req.json();
    }
  } catch {
    // Body parse edilemezse es geç
  }

  // Hatanı Veritabanına ve Konsola Yazılması
  await LoggerService.error(err, {
    studioId,
    userId: user?.id,
    path: c.req.path,
    method: c.req.method,
    statusCode: 500,
    requestBody: body,
    queryParams: c.req.query(),
  });

  return errorResponse(
    c,
    process.env.NODE_ENV === 'production' ? 'Sunucu içi bir hata oluştu' : err.message,
    500
  );
}