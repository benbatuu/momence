import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { ClassController } from '../controllers/class.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const classRoutes = new OpenAPIHono<AppEnv>();

classRoutes.use('*', authMiddleware);

// --- Zod Şemaları ---
const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

const DisciplineEnum = z.enum(['PILATES', 'YOGA', 'FITNESS', 'REFORMER', 'BARRE', 'OTHER']);
const ClassStatusEnum = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']);

const CreateTemplateSchema = z.object({
  title: z.string().min(2).openapi({ example: 'Reformer Flow Level 1' }),
  description: z.string().optional().openapi({ example: 'Temel omurga sağlığı ve güçlenme egzersizleri' }),
  discipline: DisciplineEnum.optional().openapi({ example: 'REFORMER' }),
  durationMin: z.number().optional().openapi({ example: 50 }),
  maxCapacity: z.number().optional().openapi({ example: 8 }),
  level: z.string().optional().openapi({ example: 'Beginner' }),
});

const CreateSessionSchema = z.object({
  templateId: z.string().uuid().optional().openapi({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }),
  instructorId: z.string().uuid().openapi({ example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
  title: z.string().min(2).openapi({ example: 'Reformer Flow Level 1' }),
  description: z.string().optional(),
  location: z.string().optional().openapi({ example: 'Main Studio' }),
  startTime: z.string().datetime().openapi({ example: '2026-10-05T10:00:00Z' }),
  endTime: z.string().datetime().optional().openapi({ example: '2026-10-05T10:50:00Z' }),
  capacity: z.number().openapi({ example: 8 }),
  lateCancelHours: z.number().optional().openapi({ example: 12 }),
});

const CalendarQuerySchema = z.object({
  startDate: z.string().openapi({ example: '2026-10-01' }),
  endDate: z.string().openapi({ example: '2026-10-07' }),
  instructorId: z.string().uuid().optional(),
  discipline: DisciplineEnum.optional(),
  status: ClassStatusEnum.optional(),
});

// --- Rota Tanımları (Sıralama Önemlidir!) ---

// 1. Ders Takvimini Getir
classRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/calendar',
    summary: 'Tarih Aralığına Göre Ders Takvimini Getir',
    tags: ['Classes'],
    request: { headers: TenantHeaderSchema, query: CalendarQuerySchema },
    responses: { [HttpStatusCode.OK]: { description: 'Ders takvimi getirildi.' } },
  }),
  ClassController.getCalendar as any
);

// 2. Ders Şablonlarını Listele
classRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/templates',
    summary: 'Ders Şablonlarını Listele',
    tags: ['Classes'],
    request: { headers: TenantHeaderSchema },
    responses: { [HttpStatusCode.OK]: { description: 'Ders şablonları listelendi.' } },
  }),
  ClassController.listTemplates as any
);

// 3. Yeni Ders Şablonu Oluştur (SUPER_ADMIN, ADMIN)
classRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/templates',
    summary: 'Yeni Ders Şablonu Oluştur (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Classes'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: CreateTemplateSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Ders şablonu oluşturuldu.' } },
  }),
  ClassController.createTemplate as any
);

// 4. Ders Şablonunu Güncelle (SUPER_ADMIN, ADMIN)
classRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/templates/{id}',
    summary: 'Ders Şablonunu Güncelle (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Classes'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: CreateTemplateSchema.partial() } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Ders şablonu güncellendi.' } },
  }),
  ClassController.updateTemplate as any
);

// 5. Takvime Yeni Ders Seansı Ekle (SUPER_ADMIN, ADMIN)
classRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/sessions',
    summary: 'Takvime Yeni Ders Seansı Ekle (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Classes'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: CreateSessionSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Ders seansı oluşturuldu.' } },
  }),
  ClassController.createSession as any
);

// 6. Tekil Ders Seansı Detayı
classRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/sessions/{id}',
    summary: 'Tekil Ders Seansı Detayı ve Katılımcı Listesi',
    tags: ['Classes'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Ders seansı detayı getirildi.' } },
  }),
  ClassController.getSessionById as any
);

// 7. Ders Seansını Güncelle (SUPER_ADMIN, ADMIN)
classRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/sessions/{id}',
    summary: 'Ders Seansını Güncelle (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Classes'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: CreateSessionSchema.partial() } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Ders seansı güncellendi.' } },
  }),
  ClassController.updateSession as any
);

// 8. Ders Seansını İptal Et (SUPER_ADMIN, ADMIN)
classRoutes.openapi(
  createRoute({
    method: 'patch',
    path: '/sessions/{id}/cancel',
    summary: 'Ders Seansını İptal Et ve Üye Haklarını İade Et (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Classes'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: z.object({ reason: z.string().optional() }) } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Ders seansı iptal edildi.' } },
  }),
  ClassController.cancelSession as any
);

export { classRoutes };