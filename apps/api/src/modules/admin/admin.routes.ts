import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

export const adminRouter = new OpenAPIHono();

// Admin Dashboard Özeti İskeleti
adminRouter.openapi(
  createRoute({
    method: 'get',
    path: '/dashboard',
    tags: ['Admin Paneli'],
    summary: 'Yönetici Paneli Genel Özeti',
    description: 'Aktif stüdyo için özet metrikleri döner.',
    responses: {
      200: {
        description: 'Başarılı özet verisi',
        content: {
          'application/json': {
            schema: z.object({
              activeMembers: z.number().openapi({ example: 120 }),
              todayBookings: z.number().openapi({ example: 45 }),
              monthlyRevenueKurus: z.number().openapi({ example: 12500000 }),
            }),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json({
      activeMembers: 0,
      todayBookings: 0,
      monthlyRevenueKurus: 0,
    });
  }
);
