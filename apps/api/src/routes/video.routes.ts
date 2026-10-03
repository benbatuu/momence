import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { VideoController } from '../controllers/video.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const videoRoutes = new OpenAPIHono<AppEnv>();

videoRoutes.use('*', authMiddleware);

const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

const DisciplineEnum = z.enum(['PILATES', 'YOGA', 'FITNESS', 'REFORMER', 'BARRE', 'OTHER']);

const GetUploadUrlSchema = z.object({
  fileName: z.string().openapi({ example: 'morning-flow-pilates.mp4' }),
  contentType: z.string().openapi({ example: 'video/mp4' }),
  folder: z.enum(['videos', 'classes', 'thumbnails', 'avatars']).optional().openapi({ example: 'videos' }),
});

const CreateVideoSchema = z.object({
  title: z.string().min(2).openapi({ example: 'Sabah Esnemesi & Omurga Mobilizasyonu' }),
  description: z.string().optional(),
  videoUrl: z.string().url().openapi({ example: 'https://pub-r2.dev/studio-id/videos/123.mp4' }),
  thumbnailUrl: z.string().url().optional(),
  durationSec: z.number().optional().openapi({ example: 900 }),
  discipline: DisciplineEnum.optional(),
  isRequiredPackage: z.boolean().optional(),
});

const UpdateVideoSchema = z.object({
  title: z.string().min(2).optional().openapi({ example: 'Sabah Esnemesi & Omurga Mobilizasyonu (Güncel)' }),
  description: z.string().optional(),
  videoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  durationSec: z.number().optional(),
  discipline: DisciplineEnum.optional(),
  isRequiredPackage: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// --- Rota Tanımları ---

// 1. Cloudflare R2 Upload URL Al (ADMIN, INSTRUCTOR)
videoRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/upload-url',
    summary: 'Cloudflare R2 Presigned Video Upload URL Al',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR')] as const,
    tags: ['Videos'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: GetUploadUrlSchema } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Upload URL ve R2 Key oluşturuldu.' } },
  }),
  VideoController.getUploadUrl as any
);

// 2. Video Kaydı Oluştur (ADMIN, INSTRUCTOR)
videoRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    summary: 'Videoyu Kütüphaneye Kaydet',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR')] as const,
    tags: ['Videos'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: CreateVideoSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Video kaydı oluşturuldu.' } },
  }),
  VideoController.createVideo as any
);

// 3. Video Güncelle (PUT /api/videos/:id)
videoRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    summary: 'Video Bilgilerini Güncelle',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR')] as const,
    tags: ['Videos'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: UpdateVideoSchema } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Video bilgileri güncellendi.' } },
  }),
  VideoController.updateVideo as any
);

// 4. Videoları Listele
videoRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    summary: 'On-Demand Videoları Listele',
    tags: ['Videos'],
    request: {
      headers: TenantHeaderSchema,
      query: z.object({ discipline: DisciplineEnum.optional() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Videolar listelendi.' } },
  }),
  VideoController.listVideos as any
);

// 5. Video Sil (ADMIN)
videoRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    summary: 'Videoyu ve R2 Dosyasını Sil',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Videos'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Video silindi.' } },
  }),
  VideoController.deleteVideo as any
);

videoRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    summary: 'Tekil Video Detayını Getir',
    tags: ['Videos'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Video detayı getirildi.' } },
  }),
  VideoController.getVideoById as any
);

export { videoRoutes };