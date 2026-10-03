import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { StudioSettingsController } from '../controllers/studio.settings.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const studioSettingsRoutes = new OpenAPIHono<AppEnv>();

studioSettingsRoutes.use('*', authMiddleware);

const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

const UpdateStudioSettingsSchema = z.object({
  name: z.string().min(2, 'Stüdyo adı en az 2 karakter olmalıdır.').optional(),
  slug: z.string().min(2, 'Slug adı en az 2 karakter olmalıdır.').optional(),
  currency: z.string().optional(),
  timeZone: z.string().optional(),
  address: z.string().optional(),
  disciplines: z.array(z.string()).optional(),
  enabledServices: z.array(z.string()).optional(),
});

// 1. GET /api/studio/settings
studioSettingsRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    summary: 'Stüdyo Genel Ayarlarını Getir',
    tags: ['Studio Settings'],
    request: { headers: TenantHeaderSchema },
    responses: { [HttpStatusCode.OK]: { description: 'Stüdyo ayarları getirildi.' } },
  }),
  StudioSettingsController.getSettings as any
);

// 2. PUT /api/studio/settings
studioSettingsRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/',
    summary: 'Stüdyo Genel Ayarlarını Güncelle',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Studio Settings'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: UpdateStudioSettingsSchema } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Stüdyo ayarları güncellendi.' } },
  }),
  StudioSettingsController.updateSettings as any
);

export { studioSettingsRoutes };