import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { ProductController } from '../controllers/product.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const productRoutes = new OpenAPIHono<AppEnv>();

productRoutes.use('*', authMiddleware);

// --- Zod Şemaları ---
const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

const PaymentMethodEnum = z.enum(['CREDIT_CARD', 'CASH', 'EFT', 'PAYTR']);

const CreateProductSchema = z.object({
  name: z.string().min(2).openapi({ example: 'OM Pilates Kaydırmaz Çorap' }),
  description: z.string().optional().openapi({ example: 'Beden: M/L, Renk: Siyah' }),
  price: z.number().openapi({ example: 350.0 }),
  stock: z.number().openapi({ example: 50 }),
  imageUrl: z.string().url().optional(),
});

const CreateOrderSchema = z.object({
  userId: z.string().uuid().openapi({ example: 'ea856e1a-2c9f-46e5-9e0d-9c7ff12e85b6' }),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().min(1),
    })
  ).min(1),
  paymentMethod: PaymentMethodEnum.optional().openapi({ example: 'CASH' }),
});

// --- Rota Tanımları (Sıralama Önemlidir!) ---

// 1. POS Satış / Sipariş Yap (SUPER_ADMIN, ADMIN)
productRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/orders',
    summary: 'POS Mağaza Satışı Yap (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Store & Products'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: CreateOrderSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Sipariş oluşturuldu.' } },
  }),
  ProductController.createOrder as any
);

// 2. Satış / Sipariş Geçmişini Listele (SUPER_ADMIN, ADMIN)
productRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/orders',
    summary: 'Satış/Sipariş Geçmişini Listele',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Store & Products'],
    request: {
      headers: TenantHeaderSchema,
      query: z.object({ userId: z.string().uuid().optional() }),
    },
    responses: { [HttpStatusCode.OK]: { description: 'Sipariş geçmişi getirildi.' } },
  }),
  ProductController.listOrders as any
);

// 3. Ürünleri Listele
productRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    summary: 'Mağaza Ürünlerini Listele',
    tags: ['Store & Products'],
    request: { headers: TenantHeaderSchema },
    responses: { [HttpStatusCode.OK]: { description: 'Ürün listesi getirildi.' } },
  }),
  ProductController.listProducts as any
);

// 4. Yeni Ürün Ekle (SUPER_ADMIN, ADMIN)
productRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    summary: 'Yeni Mağaza Ürünü Ekle (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Store & Products'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: CreateProductSchema } } },
    },
    responses: { [HttpStatusCode.CREATED]: { description: 'Ürün oluşturuldu.' } },
  }),
  ProductController.createProduct as any
);

// 5. Ürün Güncelle (SUPER_ADMIN, ADMIN)
productRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    summary: 'Mağaza Ürününü Güncelle (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Store & Products'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: CreateProductSchema.partial().extend({ isActive: z.boolean().optional() }) } } },
    },
    responses: { [HttpStatusCode.OK]: { description: 'Ürün güncellendi.' } },
  }),
  ProductController.updateProduct as any
);

// 6. Ürün Sil (SUPER_ADMIN, ADMIN)
productRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    summary: 'Mağaza Ürününü Sil (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Store & Products'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: { [HttpStatusCode.NO_CONTENT]: { description: 'Ürün silindi.' } },
  }),
  ProductController.deleteProduct as any
);

export { productRoutes };