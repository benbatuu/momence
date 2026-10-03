import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { prisma } from '../../utils/prisma';
import { redisConnection } from '../../utils/redis';
import { env } from '../../config/env';

export const healthRouter = new OpenAPIHono();

const HealthResponseSchema = z.object({
  status: z.string().openapi({ example: 'ok' }),
  timestamp: z.string().openapi({ example: '2026-10-04T00:00:00.000Z' }),
});

const ReadyResponseSchema = z.object({
  status: z.string().openapi({ example: 'ready' }),
  checks: z.object({
    database: z.enum(['up', 'down']).openapi({ example: 'up' }),
    redis: z.enum(['up', 'down']).openapi({ example: 'up' }),
  }),
  timestamp: z.string().openapi({ example: '2026-10-04T00:00:00.000Z' }),
});

const StatusResponseSchema = z.object({
  service: z.string().openapi({ example: 'studio-os-api' }),
  version: z.string().openapi({ example: '1.0.0' }),
  environment: z.string().openapi({ example: 'development' }),
  uptimeSeconds: z.number().openapi({ example: 42.5 }),
  memory: z.object({
    rssMb: z.number().openapi({ example: 45.2 }),
    heapUsedMb: z.number().openapi({ example: 28.1 }),
  }),
  timestamp: z.string().openapi({ example: '2026-10-04T00:00:00.000Z' }),
});

// 1. /health - Liveness Check
healthRouter.openapi(
  createRoute({
    method: 'get',
    path: '/health',
    tags: ['Sistem ve Sağlık'],
    summary: 'Canlılık Kontrolü (Liveness Probe)',
    description: 'API sunucusunun çalıştığını doğrular. Altyapı ve orkestrasyon tarafından kullanılır.',
    responses: {
      200: {
        description: 'Sunucu canlı ve istek kabul ediyor',
        content: {
          'application/json': {
            schema: HealthResponseSchema,
          },
        },
      },
    },
  }),
  (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }
);

// 2. /ready - Readiness Check
healthRouter.openapi(
  createRoute({
    method: 'get',
    path: '/ready',
    tags: ['Sistem ve Sağlık'],
    summary: 'Hazır Olma Kontrolü (Readiness Probe)',
    description: 'Veritabanı (PostgreSQL) ve Redis bağlantılarını test ederek servisin trafik almaya hazır olduğunu doğrular.',
    responses: {
      200: {
        description: 'Tüm bağımlılıklar sağlıklı',
        content: {
          'application/json': {
            schema: ReadyResponseSchema,
          },
        },
      },
      503: {
        description: 'Bir veya daha fazla bağımlılık erişilemez durumda',
        content: {
          'application/json': {
            schema: ReadyResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    let dbStatus: 'up' | 'down' = 'down';
    let redisStatus: 'up' | 'down' = 'down';

    // Veritabanı kontrolü
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    // Redis kontrolü
    try {
      const pong = await redisConnection.ping();
      if (pong === 'PONG') redisStatus = 'up';
    } catch {
      redisStatus = 'down';
    }

    const isReady = dbStatus === 'up'; // Minimum DB şart
    const statusCode = isReady ? 200 : 503;

    return c.json(
      {
        status: isReady ? 'ready' : 'not_ready',
        checks: {
          database: dbStatus,
          redis: redisStatus,
        },
        timestamp: new Date().toISOString(),
      },
      statusCode
    );
  }
);

// 3. /status - System Information
healthRouter.openapi(
  createRoute({
    method: 'get',
    path: '/status',
    tags: ['Sistem ve Sağlık'],
    summary: 'Sistem Durumu ve Metrikler',
    description: 'Uptime, bellek tüketimi ve sürüm bilgilerini döner.',
    responses: {
      200: {
        description: 'Sistem durumu',
        content: {
          'application/json': {
            schema: StatusResponseSchema,
          },
        },
      },
    },
  }),
  (c) => {
    const memory = process.memoryUsage();
    return c.json({
      service: 'studio-os-api',
      version: '1.0.0',
      environment: env.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rssMb: Math.round((memory.rss / (1024 * 1024)) * 10) / 10,
        heapUsedMb: Math.round((memory.heapUsed / (1024 * 1024)) * 10) / 10,
      },
      timestamp: new Date().toISOString(),
    });
  }
);
