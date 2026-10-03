import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const reportRoutes = new OpenAPIHono<AppEnv>();

reportRoutes.use('*', authMiddleware);

// --- Zod Şemaları ---
const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

const FinancialReportQuerySchema = z.object({
  startDate: z.string().openapi({ example: '2026-10-01' }),
  endDate: z.string().openapi({ example: '2026-10-31' }),
});

// --- Rota Tanımları ---

// 1. Finansal Rapor Getir (SUPER_ADMIN, ADMIN)
reportRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/financial',
    summary: 'Stüdyo Finansal Gelir/Gider Raporunu Getir (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Reports & Analytics'],
    request: {
      headers: TenantHeaderSchema,
      query: FinancialReportQuerySchema,
    },
    responses: { [HttpStatusCode.OK]: { description: 'Finansal rapor getirildi.' } },
  }),
  ReportController.getFinancialReport as any
);

reportRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/overview',
    summary: 'Stüdyo Genel Analitik ve Performans Raporu (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Reports & Analytics'],
    request: {
      headers: TenantHeaderSchema,
      query: z.object({
        startDate: z.string().optional().openapi({ example: '2026-09-01' }),
        endDate: z.string().optional().openapi({ example: '2026-10-01' }),
      }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Rapor verileri getirildi.' } },
  }),
  ReportController.getOverviewReport as any
);

export { reportRoutes };