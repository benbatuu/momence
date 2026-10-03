import type { Context, Next } from 'hono';
import { verifyAccessToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import { prisma } from '../utils/prisma';
import HttpStatusCode from '../types/httpstatuscode';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(c, 'Erişim yetkisi yok. Token bulunamadı.', HttpStatusCode.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1]!;
  const payload = await verifyAccessToken(token);

  if (!payload) {
    return errorResponse(c, 'Geçersiz veya süresi dolmuş token.', HttpStatusCode.UNAUTHORIZED);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, studioId: true, role: true, email: true, name: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return errorResponse(c, 'Kullanıcı bulunamadı veya hesabı pasif.', HttpStatusCode.UNAUTHORIZED);
  }

  // Rol Tabanlı Tenant İzolasyonu
  if (user.role === 'ADMIN') {
    // Admin opsiyonel olarak header üzerinden stüdyo filtreleyebilir.
    // Eğer header yoksa c.get('studioId') undefined kalır ve global sorgulama yapılır.
  } else {
    // CLIENT veya INSTRUCTOR: Dışarıdan gelen header göz ardı edilir,
    // doğrudan veritabanındaki studioId değerine kilitlenir.
    c.set('studioId', user.studioId);
  }

  c.set('user', user);
  await next();
}

/**
 * Rol Tabanlı Yetkilendirme Middleware'i (RBAC)
 */
export function requireRoles(...roles: Array<'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'CLIENT'>) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user || !roles.includes(user.role)) {
      return errorResponse(
        c,
        'Bu işlem için yetkiniz bulunmamaktadır.',
        HttpStatusCode.FORBIDDEN
      );
    }

    await next();
  };
}