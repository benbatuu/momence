import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { BookingController } from '../controllers/booking.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const bookingRoutes = new OpenAPIHono<AppEnv>();

bookingRoutes.use('*', authMiddleware);

// --- Zod Şemaları ---
const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

const CreateBookingSchema = z.object({
  sessionId: z.string().uuid().openapi({ example: 'f1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d' }),
  userId: z.string().uuid().optional().openapi({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'Admin başkası adına yaparken kullanır' }),
  clientPackageId: z.string().uuid().optional(),
});

const RecordAttendanceSchema = z.object({
  bookingId: z.string().uuid().openapi({ example: 'e1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b' }),
  status: z.enum(['ATTENDED', 'NO_SHOW']).openapi({ example: 'ATTENDED' }),
  notes: z.string().optional().openapi({ example: 'Derse 5 dk geç katıldı' }),
});

// --- Rota Tanımları ---

// 1. Derse Rezervasyon Yap
bookingRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    summary: 'Derse Kayıt / Rezervasyon Yap',
    tags: ['Bookings'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: CreateBookingSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Rezervasyon oluşturuldu.' } },
  }),
  BookingController.createBooking as any
);

// 2. Rezervasyonu İptal Et
bookingRoutes.openapi(
  createRoute({
    method: 'patch',
    path: '/{id}/cancel',
    summary: 'Rezervasyonu İptal Et',
    tags: ['Bookings'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Rezervasyon iptal edildi.' } },
  }),
  BookingController.cancelBooking as any
);

// 3. Yoklama Gir / Güncelle (ADMIN, INSTRUCTOR)
bookingRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/attendance',
    summary: 'Yoklama Gir veya Güncelle (Eğitmen / Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR')] as const,
    tags: ['Bookings'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: RecordAttendanceSchema } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Yoklama güncellendi.' } },
  }),
  BookingController.recordAttendance as any
);

export { bookingRoutes };