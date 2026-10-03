import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { PayoutController } from '../controllers/payout.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const payoutRoutes = new OpenAPIHono<AppEnv>();

payoutRoutes.use('*', authMiddleware);

// --- Zod Şemaları ---
const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

const CreatePayoutSchema = z.object({
  instructorId: z.string().uuid().openapi({ example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
  sessionId: z.string().uuid().optional().openapi({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }),
  amount: z.number().openapi({ example: 450.0 }),
});

// --- Rota Tanımları ---

// 1. Eğitmen Finansal Özet Metrikleri (SUPER_ADMIN, ADMIN, INSTRUCTOR)
payoutRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/summary',
    summary: 'Eğitmen Finansal Özet Tablosu',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR')] as const,
    tags: ['Instructor Payouts'],
    request: {
      headers: TenantHeaderSchema,
      query: z.object({
        instructorId: z.string().uuid().optional(),
      }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Finansal özet getirildi.' } },
  }),
  PayoutController.getSummary as any
);

// 2. Eğitmen Hakediş Kayıtlarını Listele (SUPER_ADMIN, ADMIN, INSTRUCTOR)
payoutRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    summary: 'Eğitmen Hakedişlerini Listele',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR')] as const,
    tags: ['Instructor Payouts'],
    request: {
      headers: TenantHeaderSchema,
      query: z.object({
        instructorId: z.string().uuid().optional(),
        isPaid: z.enum(['true', 'false']).optional(),
      }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Hakediş kayıtları getirildi.' } },
  }),
  PayoutController.listPayouts as any
);

// 3. Yeni Hakediş Kaydı Oluştur (SUPER_ADMIN, ADMIN)
payoutRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    summary: 'Eğitmana Hakediş Kaydı Tanımla (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Instructor Payouts'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: CreatePayoutSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Hakediş kaydı oluşturuldu.' } },
  }),
  PayoutController.createPayout as any
);

// 4. Hakediş Ödemesini "Ödendi" Olarak İşaretle (SUPER_ADMIN, ADMIN)
payoutRoutes.openapi(
  createRoute({
    method: 'patch',
    path: '/{id}/pay',
    summary: 'Hakediş Ödemesini Ödendi Olarak Onayla (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Instructor Payouts'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Ödeme onaylandı.' } },
  }),
  PayoutController.markAsPaid as any
);

// 5. Hakediş Kaydını Sil (SUPER_ADMIN, ADMIN)
payoutRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    summary: 'Hakediş Kaydını Sil (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Instructor Payouts'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Hakediş kaydı silindi.' } },
  }),
  PayoutController.deletePayout as any
);

export { payoutRoutes };