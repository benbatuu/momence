import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { PackageController } from '../controllers/package.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const packageRoutes = new OpenAPIHono<AppEnv>();

packageRoutes.use('*', authMiddleware);

// --- Zod Şemaları ---
const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

const DisciplineEnum = z.enum(['PILATES', 'YOGA', 'FITNESS', 'REFORMER', 'BARRE', 'OTHER']);
const ServiceTypeEnum = z.enum(['CLASS', 'APPOINTMENT', 'WORKSHOP', 'ON_DEMAND']);
const PackageTypeEnum = z.enum(['CREDIT_PACK', 'UNLIMITED', 'RECURRING_SUBSCRIPTION']);
const PaymentMethodEnum = z.enum(['CREDIT_CARD', 'CASH', 'EFT', 'PAYTR']);

const CreatePackageSchema = z.object({
  name: z.string().min(2).openapi({ example: "10'lu Reformer Pilates Paketi" }),
  type: PackageTypeEnum.optional().openapi({ example: 'CREDIT_PACK' }),
  creditCount: z.number().openapi({ example: 10, description: '-1 sınırsız anlamına gelir' }),
  price: z.number().openapi({ example: 3500.0 }),
  validityDays: z.number().openapi({ example: 90 }),
  allowedDisciplines: z.array(DisciplineEnum).optional().openapi({ example: ['PILATES', 'REFORMER'] }),
  allowedServices: z.array(ServiceTypeEnum).optional().openapi({ example: ['CLASS'] }),
  isOnlineSaleAllowed: z.boolean().optional().openapi({ example: true }),
});

const AssignPackageSchema = z.object({
  userId: z.string().uuid().openapi({ example: 'ea856e1a-2c9f-46e5-9e0d-9c7ff12e85b6' }),
  packageId: z.string().uuid().openapi({ example: 'f3a5b6c7-8d9e-0f1a-2b3c-4d5e6f7a8b9c' }),
  customPrice: z.number().optional().openapi({ example: 3000.0 }),
  customValidityDays: z.number().optional().openapi({ example: 120 }),
  paymentMethod: PaymentMethodEnum.optional().openapi({ example: 'CASH' }),
});

const AdjustCreditsSchema = z.object({
  creditDelta: z.number().openapi({ example: 2, description: 'Eklenecek kredi (pozitif) veya düşülecek kredi (negatif)' }),
  reason: z.string().optional().openapi({ example: 'Müşteri memnuniyeti telafisi' }),
});

const CancelPackageSchema = z.object({
  reason: z.string().optional().openapi({ example: 'Üye talebi ile iade yapıldı' }),
});

// --- Rota Tanımları (Sıralama Önemlidir) ---

// 1. Paket Şablonlarını Listele
packageRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    summary: 'Paket Şablonlarını Listele',
    tags: ['Packages'],
    request: { headers: TenantHeaderSchema },
    responses: { [HttpStatusCode.OK]: { description: 'Paket listesi getirildi.' } },
  }),
  PackageController.listPackages as any
);

// 2. Müşteriye Paket Tanımla / Satış Yap (SUPER_ADMIN, ADMIN)
packageRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/assign',
    summary: 'Müşteriye Paket Tanımla/Satış Yap',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Packages'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: AssignPackageSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Paket tanımlandı.' } },
  }),
  PackageController.assignPackage as any
);

// 3. Müşterinin Paketlerini Listele
packageRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/client/{userId}',
    summary: 'Müşterinin Aktif/Geçmiş Paketlerini Listele',
    tags: ['Packages'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ userId: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Müşteri paketleri getirildi.' } },
  }),
  PackageController.getClientPackages as any
);

// 4. Müşteri Paket Kredisini Düzenle (SUPER_ADMIN, ADMIN)
packageRoutes.openapi(
  createRoute({
    method: 'patch',
    path: '/client-package/{id}/adjust-credits',
    summary: 'Müşteri Paket Kredisini Düzenle (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Packages'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: AdjustCreditsSchema } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Kredi güncellendi.' } },
  }),
  PackageController.adjustCredits as any
);

// 5. Müşteri Paketini İptal Et (SUPER_ADMIN, ADMIN)
packageRoutes.openapi(
  createRoute({
    method: 'patch',
    path: '/client-package/{id}/cancel',
    summary: 'Müşteri Paketini İptal Et (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Packages'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: CancelPackageSchema } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Paket iptal edildi.' } },
  }),
  PackageController.cancelClientPackage as any
);

// 6. Yeni Paket Şablonu Ekle (SUPER_ADMIN, ADMIN)
packageRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    summary: 'Yeni Paket Şablonu Oluştur (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Packages'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: CreatePackageSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Paket şablonu oluşturuldu.' } },
  }),
  PackageController.createPackage as any
);

// 7. Tekil Paket Şablonu Detayı
packageRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    summary: 'Paket Şablonu Detayı',
    tags: ['Packages'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Paket detayları getirildi.' } },
  }),
  PackageController.getPackageById as any
);

// 8. Paket Şablonu Güncelle (SUPER_ADMIN, ADMIN)
packageRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    summary: 'Paket Şablonunu Güncelle (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Packages'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: CreatePackageSchema.partial() } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Paket güncellendi.' } },
  }),
  PackageController.updatePackage as any
);

export { packageRoutes };