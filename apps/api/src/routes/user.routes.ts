import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { UserController } from '../controllers/user.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import HttpStatusCode from '../types/httpstatuscode';

const userRoutes = new OpenAPIHono<AppEnv>();

// Tüm user endpoint'leri authMiddleware'den geçer
userRoutes.use('*', authMiddleware);

// --- Zod Şemaları ---

const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({ example: 'om-pilates' }),
});

const UserQuerySchema = z.object({
  search: z.string().optional().openapi({ example: 'Batuhan' }),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'CLIENT']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  page: z.string().optional().openapi({ example: '1' }),
  limit: z.string().optional().openapi({ example: '10' }),
});

const CreateUserSchema = z.object({
  name: z.string().min(2).openapi({ example: 'Mehmet Yılmaz' }),
  email: z.string().email().openapi({ example: 'mehmet@example.com' }),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'CLIENT']).openapi({ example: 'CLIENT' }),
  phone: z.string().optional().openapi({ example: '+905551112233' }),
  password: z.string().min(6).optional().openapi({ example: '123456' }),
  identityNumber: z.string().optional().openapi({ example: '12345678901' }),
});

const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional().openapi({ example: 'Batuhan Küçük' }),
  email: z.string().email().optional().openapi({ example: 'batuhan@example.com' }),
  phone: z.string().optional().openapi({ example: '+905551112233' }),
  avatarUrl: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).openapi({ example: '123456' }),
  newPassword: z.string().min(6).openapi({ example: 'newPassword123' }),
});

// --- Rota Tanımları ---

// 1. Kullanıcıları Listele (SUPER_ADMIN, ADMIN)
userRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    summary: 'Kullanıcıları Listele (Arama & Filtreleme)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Users'],
    request: { headers: TenantHeaderSchema, query: UserQuerySchema },
    responses: {
      [HttpStatusCode.OK]: { description: 'Kullanıcı listesi getirildi.' },
    },
  }),
  UserController.listUsers
);

// 2. Kendi Profilini Güncelle (/dashboard/settings)
userRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/profile',
    summary: 'Kendi Profil Bilgilerini Güncelle',
    tags: ['Users'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: UpdateProfileSchema } } },
    },
    responses: {
      [HttpStatusCode.OK]: { description: 'Profil güncellendi.' },
      [HttpStatusCode.BAD_REQUEST]: { description: 'Geçersiz veri veya e-posta kullanımda.' },
    },
  }),
  UserController.updateProfile
);

// 3. Kendi Şifresini Değiştir (/dashboard/settings)
userRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/change-password',
    summary: 'Kendi Şifresini Değiştir',
    tags: ['Users'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: ChangePasswordSchema } } },
    },
    responses: {
      [HttpStatusCode.OK]: { description: 'Şifre değiştirildi.' },
      [HttpStatusCode.BAD_REQUEST]: { description: 'Mevcut şifre hatalı veya yetersiz yeni şifre.' },
    },
  }),
  UserController.changePassword
);

// 4. Yeni Kullanıcı / Personel Oluştur (SUPER_ADMIN, ADMIN)
userRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    summary: 'Yeni Kullanıcı/Personel Ekle (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Users'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: CreateUserSchema } } },
    },
    responses: {
      [HttpStatusCode.CREATED]: { description: 'Kullanıcı oluşturuldu.' },
      [HttpStatusCode.BAD_REQUEST]: { description: 'Hatalı istek.' },
    },
  }),
  UserController.createUser
);

// 5. Tekil Kullanıcı Detayı (SUPER_ADMIN, ADMIN)
userRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    summary: 'Kullanıcı Detayı',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Users'],
    request: { headers: TenantHeaderSchema, params: z.object({ id: z.string().uuid() }) },
    responses: {
      [HttpStatusCode.OK]: { description: 'Kullanıcı detayı getirildi.' },
      [HttpStatusCode.NOT_FOUND]: { description: 'Kullanıcı bulunamadı.' },
    },
  }),
  UserController.getUserById
);

// 6. Kullanıcı Durumunu Aktif/Pasif Yap (SUPER_ADMIN, ADMIN)
userRoutes.openapi(
  createRoute({
    method: 'patch',
    path: '/{id}/status',
    summary: 'Kullanıcıyı Aktif/Pasif Yap (Admin)',
    middleware: [requireRoles('SUPER_ADMIN', 'ADMIN')] as const,
    tags: ['Users'],
    request: {
      headers: TenantHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: z.object({ isActive: z.boolean() }) } } },
    },
    responses: {
      [HttpStatusCode.OK]: { description: 'Durum güncellendi.' },
    },
  }),
  UserController.toggleStatus
);

export { userRoutes };