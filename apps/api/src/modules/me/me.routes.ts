import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

export const meRouter = new OpenAPIHono();

// Müşteri Profil Özeti İskeleti
meRouter.openapi(
  createRoute({
    method: 'get',
    path: '/profile',
    tags: ['Müşteri (Me)'],
    summary: 'Giriş Yapan Müşteri Profili',
    description: 'Müşterinin profil, üyelik ve rezervasyon durumunu döner.',
    responses: {
      200: {
        description: 'Müşteri profili',
        content: {
          'application/json': {
            schema: z.object({
              id: z.string().uuid().openapi({ example: '018f2f45-6789-7000-8000-000000000001' }),
              name: z.string().openapi({ example: 'Ayşe Yılmaz' }),
              email: z.string().email().openapi({ example: 'ayse@example.com' }),
            }),
          },
        },
      },
      401: {
        description: 'Yetkisiz erişim',
      },
    },
  }),
  (c) => {
    return c.json({
      id: '018f2f45-6789-7000-8000-000000000001',
      name: 'Misafir Müşteri',
      email: 'misafir@example.com',
    });
  }
);
