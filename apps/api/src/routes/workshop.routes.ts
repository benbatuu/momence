import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { WorkshopController } from '../controllers/workshop.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const workshopRoutes = new OpenAPIHono<AppEnv>();

workshopRoutes.use('*', authMiddleware);

// --- Zod Şemaları ---
const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

const PaymentMethodEnum = z.enum(['CREDIT_CARD', 'CASH', 'EFT', 'PAYTR']);

const CreateWorkshopSchema = z.object({
  title: z.string().min(2).openapi({ example: 'Anatomi & Biyomekanik Masterclass' }),
  description: z.string().optional().openapi({ example: 'Pilates eğitmenleri ve ileri seviye uygulayıcılar için' }),
  instructor: z.string().optional().openapi({ example: 'Dr. Ahmet Yılmaz' }),
  price: z.number().openapi({ example: 1500.0 }),
  capacity: z.number().openapi({ example: 20 }),
  startTime: z.string().datetime().openapi({ example: '2026-11-15T09:00:00Z' }),
  endTime: z.string().datetime().openapi({ example: '2026-11-15T17:00:00Z' }),
  location: z.string().optional().openapi({ example: 'Main Hall' }),
});

const BuyTicketSchema = z.object({
  userId: z.string().uuid().optional().openapi({ example: 'ea856e1a-2c9f-46e5-9e0d-9c7ff12e85b6', description: 'Admin başkasına bilet keserken geçer' }),
  paymentMethod: PaymentMethodEnum.optional().openapi({ example: 'CASH' }),
});

// --- Rota Tanımları (Sıralama Önemlidir) ---

// 1. Atölyeye Bilet Satın Al / Bilet Kes
workshopRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/{id}/tickets',
    summary: 'Atölye Bileti Satın Al / Bilet Kes',
    tags: ['Workshops'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: BuyTicketSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Bilet oluşturuldu.' } },
  }),
  WorkshopController.buyTicket as any
);

// 2. Atölyeleri Listele
workshopRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    summary: 'Atölyeleri Listele',
    tags: ['Workshops'],
    request: { headers: TenantHeaderSchema },
    responses: { [HttpStatusCode.OK]: { description: 'Atölyeler listelendi.' } },
  }),
  WorkshopController.listWorkshops as any
);

// 3. Yeni Atölye Oluştur (SUPER_ADMIN, ADMIN)
workshopRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    summary: 'Yeni Atölye/Workshop Oluştur (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Workshops'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: CreateWorkshopSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Atölye oluşturuldu.' } },
  }),
  WorkshopController.createWorkshop as any
);

// 4. Tekil Atölye Detayı ve Katılımcı Listesi
workshopRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    summary: 'Tekil Atölye Detayı ve Bilet Katılımcıları',
    tags: ['Workshops'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Atölye detayları getirildi.' } },
  }),
  WorkshopController.getWorkshopById as any
);

// 5. Atölyeyi Güncelle (SUPER_ADMIN, ADMIN)
workshopRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    summary: 'Atölyeyi Güncelle (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Workshops'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: CreateWorkshopSchema.partial().extend({ isActive: z.boolean().optional() }) } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Atölye güncellendi.' } },
  }),
  WorkshopController.updateWorkshop as any
);

export { workshopRoutes };