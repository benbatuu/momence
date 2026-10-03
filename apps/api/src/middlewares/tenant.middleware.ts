import type { Context, Next } from 'hono';
import { prisma } from '../utils/prisma';
import { errorResponse } from '../utils/response';

export async function tenantMiddleware(c: Context, next: Next) {
  // 1. Header veya Subdomain kontrolü
  let subdomain = c.req.header('X-Studio-Subdomain') || c.req.header('x-studio-subdomain');

  if (!subdomain) {
    const host = c.req.header('host') || '';
    const parts = host.split('.');
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  }

  // Local geliştirme kolaylığı (Swagger / Localhost istekleri için varsayılan stüdyo)
  if (!subdomain && process.env.NODE_ENV !== 'production') {
    subdomain = 'om-pilates';
  }

  if (!subdomain) {
    return errorResponse(c, 'Stüdyo bilgisi (subdomain) eksik', 400);
  }

  // 2. Veritabanından stüdyoyu sorgula
  const studio = await prisma.studio.findUnique({
    where: { subdomain },
  });

  if (!studio) {
    return errorResponse(c, 'Geçersiz veya bulunamayan stüdyo', 404);
  }

  // 3. Stüdyo bilgisini Hono Context'ine kaydet
  c.set('studio', studio);
  c.set('studioId', studio.id);

  await next();
}