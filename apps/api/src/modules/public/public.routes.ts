import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

export const publicRouter = new OpenAPIHono();

// Halka Açık Stüdyo Programı İskeleti
publicRouter.openapi(
  createRoute({
    method: 'get',
    path: '/{slug}/schedule',
    tags: ['Halka Açık (Public)'],
    summary: 'Stüdyo Halka Açık Takvim ve Ders Listesi',
    description: 'Anonim ziyaretçiler ve web sitesi embed widgetları için stüdyo ders programını listeler.',
    request: {
      params: z.object({
        slug: z.string().openapi({ example: 'kadikoy-pilates' }),
      }),
    },
    responses: {
      200: {
        description: 'Ders listesi',
        content: {
          'application/json': {
            schema: z.object({
              studioName: z.string().openapi({ example: 'Kadıköy Pilates' }),
              sessions: z.array(
                z.object({
                  id: z.string().uuid().openapi({ example: '018f2f45-6789-7000-8000-000000000002' }),
                  title: z.string().openapi({ example: 'Reformer Pilates Başlangıç' }),
                  startTime: z.string().openapi({ example: '2026-10-04T09:00:00Z' }),
                  capacity: z.number().openapi({ example: 8 }),
                  remainingSpots: z.number().openapi({ example: 3 }),
                })
              ),
            }),
          },
        },
      },
    },
  }),
  (c) => {
    const { slug } = c.req.valid('param');
    return c.json({
      studioName: `${slug.toUpperCase()} Stüdyosu`,
      sessions: [],
    });
  }
);
