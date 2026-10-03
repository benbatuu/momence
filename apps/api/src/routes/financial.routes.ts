import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { FinancialController } from '../controllers/financial.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const financialRoutes = new OpenAPIHono<AppEnv>();

financialRoutes.use('*', authMiddleware);

const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

// GET /api/financials/revenue-stats (Sadece Admin ve Super Admin)
financialRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/revenue-stats',
    summary: 'Stüdyo Ciro ve Gelir Dağılım Raporu',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Financials'],
    request: {
      headers: TenantHeaderSchema,
      query: z.object({
        startDate: z.string().optional().openapi({ example: '2026-01-01' }),
        endDate: z.string().optional().openapi({ example: '2026-12-31' }),
      }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Ciro ve kanal analitiği getirildi.' } },
  }),
  FinancialController.getRevenueStats as any
);

// GET /api/financials/payments/{id}
financialRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/payments/{id}',
    summary: 'Tekil Ödeme Detayını Getir',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Financials'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Ödeme detayları getirildi.' } },
  }),
  FinancialController.getPaymentById as any
);

export { financialRoutes };