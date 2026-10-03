import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { etag } from 'hono/etag';
import { secureHeaders } from 'hono/secure-headers';
import type { AppEnv } from './types/env';
import { globalErrorHandler } from './middlewares/error.middleware';
import { tenantMiddleware } from './middlewares/tenant.middleware';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { packageRoutes } from './routes/package.routes';
import { classRoutes } from './routes/class.routes';
import { bookingRoutes } from './routes/booking.routes';
import { appointmentRoutes } from './routes/appointment.routes';
import { videoRoutes } from './routes/video.routes';
import { productRoutes } from './routes/product.routes';
import { studioRoutes } from './routes/studio.routes';
import { workshopRoutes } from './routes/workshop.routes';
import { payoutRoutes } from './routes/payout.routes';
import { reportRoutes } from './routes/report.routes';
import { auditLogRoutes } from './routes/auditlog.routes';
import { financialRoutes } from './routes/financial.routes';
import { studioSettingsRoutes } from './routes/studio.settings.routes';

// Standard Hono yerine OpenAPIHono kullanıyoruz
const app = new OpenAPIHono<AppEnv>();

app.use('*', cors({
    origin: (origin) => {
      // Geliştirme ortamı ve dinamik subdomain'ler için izin verilen origin'ler
      if (
        !origin ||
        origin.includes('localhost') ||
        origin.endsWith('.localhost:3000') ||
        origin.endsWith('.yourdomain.com') // Prod domaininiz
      ) {
        return origin || '*';
      }
      return 'http://localhost:3000';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'x-studio-subdomain', // Özel tenant header'ımız
      'X-Requested-With',
    ],
    exposeHeaders: ['Content-Length', 'x-studio-subdomain'],
    maxAge: 600, // Preflight isteklerini 10 dakika önbellekle
    credentials: true, // withCredentials: true kullanımı için KRİTİK!
  })
);
app.use('*', etag());
app.use('*', secureHeaders());
app.onError(globalErrorHandler);

app.use('*', async (c, next) => {
  logger();
  await next();
  c.header('X-Powered-By', 'bennbatuu');
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tenant Middleware
app.use('/api/*', tenantMiddleware);

// API Rotaları
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/packages', packageRoutes);
app.route('/api/classes', classRoutes);
app.route('/api/bookings', bookingRoutes);
app.route('/api/appointments', appointmentRoutes);
app.route('/api/videos', videoRoutes);
app.route('/api/products', productRoutes);
app.route('/api/super-admin/studios', studioRoutes);
app.route('/api/workshops', workshopRoutes);
app.route('/api/payouts', payoutRoutes);
app.route('/api/reports', reportRoutes);
app.route('/api/auditlogs', auditLogRoutes);
app.route('/api/financials', financialRoutes);
app.route('/api/studio-settings', studioSettingsRoutes);

// OpenAPI JSON Endpoint Spec (Otomatik üretilir)
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    title: 'Momence-tr SaaS API',
    version: '1.0.0',
    description: 'Multi-tenant Pilates & Yoga Stüdyo Yönetim API Dokümantasyonu',
  },
  security: [{ BearerAuth: [] }],
});

// Swagger Security Scheme
app.openAPIRegistry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Lütfen JWT Access Token bilginizi girin.',
});

// Swagger UI Arayüzü
app.get('/swagger', swaggerUI({ url: '/doc' }));

export default {
  port: process.env.PORT || 3001,
  fetch: app.fetch,
};