import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types/env';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rateLimiter } from '../middlewares/ratelimit.middleware';

const authRoutes = new OpenAPIHono<AppEnv>();

// ENV Tabanlı Dynamic Rate Limiters
const registerLimiter = rateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_REGISTER_WINDOW_MS) || 60000,
  max: Number(process.env.RATE_LIMIT_REGISTER_MAX) || 5,
  message: 'Çok fazla kayıt denemesi yaptınız. Lütfen bekleyin.',
});

const loginLimiter = rateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 60000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 10,
  message: 'Çok fazla hatalı giriş denemesi. Lütfen bekleyin.',
});

const forgotLimiter = rateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_FORGOT_WINDOW_MS) || 900000,
  max: Number(process.env.RATE_LIMIT_FORGOT_MAX) || 3,
  message: 'Çok fazla şifre sıfırlama talebinde bulundunuz.',
});

// Rate Limiter Middleware Uygulaması
authRoutes.use('/register', registerLimiter);
authRoutes.use('/login', loginLimiter);
authRoutes.use('/forgot-password', forgotLimiter);

// Zod Şemaları
const TenantHeaderSchema = z.object({
  'x-studio-subdomain': z.string().optional().openapi({
    example: 'om-pilates',
    description: 'Hedef stüdyo subdomain bilgisi (SUPER_ADMIN girişlerinde opsiyoneldir)',
  }),
});

const RegisterSchema = z.object({
  name: z.string().min(2).openapi({ example: 'Batuhan Küçük' }),
  email: z.string().email().openapi({ example: 'batuhan@example.com' }),
  password: z.string().min(6).openapi({ example: '123456' }), // Zorunlu yapıldı
  phone: z.string().optional().openapi({ example: '+905551234567' }),
});

const LoginSchema = z.object({
  email: z.string().email().openapi({ example: 'admin@ompilates.com' }),
  password: z.string().min(1).openapi({ example: '123456' }), // Zorunlu yapıldı
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1Ni...' }),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email().openapi({ example: 'admin@ompilates.com' }),
});

const ResetPasswordSchema = z.object({
  email: z.string().email().openapi({ example: 'admin@ompilates.com' }),
  otpCode: z.string().length(6).openapi({ example: '482910' }),
  newPassword: z.string().min(6).openapi({ example: 'newPassword123' }),
});

const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'CLIENT']),
  studioId: z.string().nullable().optional(),
});

// --- OpenAPI Route Tanımları ---

// 1. Kullanıcı Kaydı (Register)
authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/register',
    summary: 'Kullanıcı Kaydı',
    description: 'Stüdyoya yeni müşteri/danışan kaydı oluşturur.',
    tags: ['Auth'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: RegisterSchema } } },
    },
    responses: {
      201: { description: 'Kullanıcı kaydı başarılı' },
      400: { description: 'Geçersiz veri veya e-posta kullanımda' },
    },
  }),
  AuthController.register as any
);

// 2. Giriş Yap (Login)
authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/login',
    summary: 'Giriş Yap',
    description: 'SUPER_ADMIN veya Stüdyo kullanıcıları (ADMIN, INSTRUCTOR, CLIENT) için giriş endpoint\'i.',
    tags: ['Auth'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: LoginSchema } } },
    },
    responses: {
      200: { description: 'Giriş başarılı' },
      401: { description: 'E-posta veya şifre hatalı' },
    },
  }),
  AuthController.login as any
);

// 3. Mevcut Kullanıcı Bilgisi (GET /me)
authRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/me',
    summary: 'Oturum Açmış Kullanıcı Profilini Getir',
    description: 'Access Token ile oturum açmış kullanıcının güncel profil ve rol bilgilerini döner.',
    tags: ['Auth'],
    security: [{ BearerAuth: [] }],
    middleware: [authMiddleware] as any,
    responses: {
      200: {
        description: 'Kullanıcı profili getirildi',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: z.object({
                user: UserResponseSchema,
              }),
            }),
          },
        },
      },
      401: { description: 'Yetkisiz erişim / Geçersiz Token' },
    },
  }),
  AuthController.me as any
);

// 4. Access Token Yenile (Refresh Token)
authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/refresh-token',
    summary: 'Access Token Yenile',
    tags: ['Auth'],
    request: { body: { content: { 'application/json': { schema: RefreshTokenSchema } } } },
    responses: {
      200: { description: 'Token yenilendi' },
      401: { description: 'Geçersiz veya süresi dolmuş Refresh Token' },
    },
  }),
  AuthController.refreshToken as any
);

// 5. Şifremi Unuttum (Forgot Password)
authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/forgot-password',
    summary: 'Şifremi Unuttum (OTP İste)',
    tags: ['Auth'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: ForgotPasswordSchema } } },
    },
    responses: { 200: { description: 'Eğer e-posta sistemde kayıtlıysa OTP kodu gönderildi' } },
  }),
  AuthController.forgotPassword as any
);

// 6. Şifre Sıfırla (Reset Password)
authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/reset-password',
    summary: 'Şifre Sıfırla (OTP ile)',
    tags: ['Auth'],
    request: {
      headers: TenantHeaderSchema,
      body: { content: { 'application/json': { schema: ResetPasswordSchema } } },
    },
    responses: {
      200: { description: 'Şifre başarıyla güncellendi' },
      400: { description: 'Geçersiz OTP kodu veya eksik bilgi' },
    },
  }),
  AuthController.resetPassword as any
);

// 7. Çıkış Yap (Logout)
authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/logout',
    summary: 'Çıkış Yap',
    tags: ['Auth'],
    security: [{ BearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: RefreshTokenSchema } } } },
    responses: { 200: { description: 'Çıkış yapıldı' } },
  }),
  AuthController.logout as any
);

export { authRoutes };