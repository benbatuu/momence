import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

export const webhooksRouter = new OpenAPIHono();

// iyzico Webhook İskeleti
webhooksRouter.openapi(
  createRoute({
    method: 'post',
    path: '/iyzico',
    tags: ['Webhooks'],
    summary: 'iyzico Ödeme Bildirimi Webhook Ucu',
    description: 'iyzico tarafından asenkron ödeme sonuçlarının (3DS, abonelik tahsilatı) iletildiği uç.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              status: z.string().openapi({ example: 'SUCCESS' }),
              paymentId: z.string().openapi({ example: '12345678' }),
              conversationId: z.string().openapi({ example: 'conv-018f2f45' }),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Webhook başarıyla alındı',
        content: {
          'application/json': {
            schema: z.object({
              received: z.boolean().openapi({ example: true }),
            }),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json({ received: true });
  }
);
