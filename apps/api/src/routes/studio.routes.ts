import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { StudioController } from '../controllers/studio.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const studioRoutes = new OpenAPIHono<AppEnv>();

// Tüm endpoint'ler authMiddleware ve SADECE SUPER_ADMIN yetkisiyle çalışır
studioRoutes.use('*', authMiddleware);
studioRoutes.use('*', requireRoles('SUPER_ADMIN'));

// --- Zod Şemaları ---
const CreateStudioSchema = z.object({
  name: z.string().min(2).openapi({ example: 'Zen Yoga Studio' }),
  subdomain: z.string().min(2).openapi({ example: 'zen-yoga' }),
  phone: z.string().optional().openapi({ example: '+905559998877' }),
  taxNumber: z.string().optional().openapi({ example: '1234567890' }),
  taxOffice: z.string().optional().openapi({ example: 'Kadıköy' }),
  address: z.string().optional().openapi({ example: 'Moda, Kadıköy, İstanbul' }),
  currency: z.string().optional().openapi({ example: 'TRY' }),
  paytrMerchantId: z.string().optional(),
  paytrSecretKey: z.string().optional(),
  adminName: z.string().min(2).openapi({ example: 'Ayşe Kaya' }),
  adminEmail: z.string().email().openapi({ example: 'ayse@zenyoga.com' }),
  adminPassword: z.string().min(6).optional().openapi({ example: '123456' }),
});

// --- Rota Tanımları (Sıralama Önemlidir) ---

// 1. SaaS Platform Metriklerini Getir
studioRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/metrics',
    summary: 'SaaS Platform Genel Metriklerini Getir (Super Admin)',
    tags: ['SaaS Super Admin'],
    responses: { [HttpStatusCode.OK]: { description: 'Metrikler getirildi.' } },
  }),
  StudioController.getMetrics as any
);

// 2. Tüm Stüdyoları Listele
studioRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    summary: 'Tüm Stüdyoları Listele (Super Admin)',
    tags: ['SaaS Super Admin'],
    request: {
      query: z.object({
        search: z.string().optional(),
        isActive: z.enum(['true', 'false']).optional(),
      }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Stüdyo listesi getirildi.' } },
  }),
  StudioController.listStudios as any
);

// 3. Yeni Stüdyo ve Admin Hesabı Oluştur
studioRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    summary: 'Yeni Stüdyo ve Admin Oluştur (Super Admin)',
    tags: ['SaaS Super Admin'],
    request: {
      body: { content: { 'application/json': { schema: CreateStudioSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Stüdyo ve admin oluşturuldu.' } },
  }),
  StudioController.createStudio as any
);

// 4. Stüdyo Detayını Getir
studioRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    summary: 'Stüdyo Detayını Getir (Super Admin)',
    tags: ['SaaS Super Admin'],
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: { [HttpStatusCode.OK]: { description: 'Stüdyo detayları getirildi.' } },
  }),
  StudioController.getStudioById as any
);

// 5. Stüdyo Bilgilerini Güncelle
studioRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    summary: 'Stüdyo Bilgilerini Güncelle (Super Admin)',
    tags: ['SaaS Super Admin'],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: CreateStudioSchema.partial().omit({ adminName: true, adminEmail: true, adminPassword: true }) } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Stüdyo güncellendi.' } },
  }),
  StudioController.updateStudio as any
);

// 6. Stüdyo Durumunu Aktif/Pasif Yap (Askıya Al)
studioRoutes.openapi(
  createRoute({
    method: 'patch',
    path: '/{id}/status',
    summary: 'Stüdyoyu Aktif/Pasif Yap - Askıya Al (Super Admin)',
    tags: ['SaaS Super Admin'],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: z.object({ isActive: z.boolean() }) } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Stüdyo durumu güncellendi.' } },
  }),
  StudioController.toggleStatus as any
);

export { studioRoutes };