import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { AuditLogController } from '../controllers/auditlog.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const auditLogRoutes = new OpenAPIHono<AppEnv>();

// Denetim günlüklerine sadece yetkili yoneticiler (SUPER_ADMIN, ADMIN) erisebilir
auditLogRoutes.use('*', authMiddleware);
auditLogRoutes.use('*', requireRoles('SUPER_ADMIN', 'ADMIN'));

// --- Zod Şemaları ---
const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

const AuditCategoryEnum = z.enum([
  'AUTH',
  'USER_MANAGEMENT',
  'USER_PROFILE',
  'PACKAGE',
  'BOOKING',
  'APPOINTMENT',
  'STORE',
  'WORKSHOP',
  'SYSTEM',
]);

const AuditLogQuerySchema = z.object({
  actorId: z.string().uuid().optional(),
  category: AuditCategoryEnum.optional(),
  action: z.string().optional().openapi({ example: 'USER_CREATED' }),
  startDate: z.string().optional().openapi({ example: '2026-10-01' }),
  endDate: z.string().optional().openapi({ example: '2026-10-31' }),
  page: z.string().optional().openapi({ example: '1' }),
  limit: z.string().optional().openapi({ example: '20' }),
});

// --- Rota Tanımları ---

// 1. Audit Logları Listele
auditLogRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    summary: 'Sistem ve Stüdyo Denetim Günlüklerini Listele (Admin)',
    tags: ['Audit Logs'],
    request: {
      headers: TenantHeaderSchema,
      query: AuditLogQuerySchema,
    },
    responses: { [HttpStatusCode.OK]: { description: 'Denetim günlükleri getirildi.' } },
  }),
  AuditLogController.listLogs as any
);

// 2. Tekil Audit Log Detayı
auditLogRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    summary: 'Tekil Denetim Günlüğü Detayı',
    tags: ['Audit Logs'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Denetim günlüğü detayı getirildi.' } },
  }),
  AuditLogController.getLogById as any
);

export { auditLogRoutes };