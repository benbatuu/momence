import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { AppointmentController } from '../controllers/appointment.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const appointmentRoutes = new OpenAPIHono<AppEnv>();

appointmentRoutes.use('*', authMiddleware);

// --- Zod Şemaları ---
const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

const DisciplineEnum = z.enum(['PILATES', 'YOGA', 'FITNESS', 'REFORMER', 'BARRE', 'OTHER']);
const AppointmentStatusEnum = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);

const CreateAppointmentSchema = z.object({
  clientId: z.string().uuid().openapi({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }),
  instructorId: z.string().uuid().openapi({ example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
  discipline: DisciplineEnum.optional().openapi({ example: 'REFORMER' }),
  title: z.string().min(2).openapi({ example: '1-on-1 Özel Reformer Dersi' }),
  startTime: z.string().datetime().openapi({ example: '2026-10-10T14:00:00Z' }),
  endTime: z.string().datetime().openapi({ example: '2026-10-10T15:00:00Z' }),
  price: z.number().optional().openapi({ example: 850.0 }),
  clientPackageId: z.string().uuid().optional(),
  notes: z.string().optional().openapi({ example: 'Bel fıtığı hassasiyeti var' }),
});

// --- Rota Tanımları ---

// 1. Randevuları Listele
appointmentRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    summary: 'Özel Randevuları Listele (Filtreli)',
    tags: ['Appointments'],
    request: {
      headers: TenantHeaderSchema,
      query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        instructorId: z.string().uuid().optional(),
        clientId: z.string().uuid().optional(),
        status: AppointmentStatusEnum.optional(),
      }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Randevu listesi getirildi.' } },
  }),
  AppointmentController.listAppointments as any
);

// 2. Yeni Randevu Oluştur (SUPER_ADMIN, ADMIN, INSTRUCTOR)
appointmentRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    summary: 'Yeni 1-on-1 Randevu Oluştur',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR')] as const,
    tags: ['Appointments'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: CreateAppointmentSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Randevu oluşturuldu.' } },
  }),
  AppointmentController.createAppointment as any
);

// 3. Tekil Randevu Detayı
appointmentRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    summary: 'Randevu Detayı',
    tags: ['Appointments'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Randevu detayları getirildi.' } },
  }),
  AppointmentController.getById as any
);

// 4. Randevuyu Güncelle / İptal Et
appointmentRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    summary: 'Randevuyu Güncelle veya İptal Et',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR')] as const,
    tags: ['Appointments'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: CreateAppointmentSchema.partial().extend({ status: AppointmentStatusEnum.optional() }) } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Randevu güncellendi.' } },
  }),
  AppointmentController.updateAppointment as any
);

export { appointmentRoutes };