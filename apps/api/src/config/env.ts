import { z } from 'zod';
import dotenv from 'dotenv';

// .env dosyasını yükle
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  DATABASE_URL: z.string().min(1, 'DATABASE_URL zorunludur'),
  
  JWT_SECRET: z.string().default('dev-jwt-secret-change-in-prod'),
  JWT_ACCESS_SECRET: z.string().default('dev-access-secret-change-in-prod'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-in-prod'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_PORT: z.coerce.number().default(6379),
  
  RATE_LIMIT_REGISTER_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_REGISTER_MAX: z.coerce.number().default(5),
  RATE_LIMIT_LOGIN_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().default(10),
  RATE_LIMIT_FORGOT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_FORGOT_MAX: z.coerce.number().default(3),
  
  // Bulut ve 3. Parti Entegrasyonlar (Opsiyonel / İlerleyen Görevler)
  SENTRY_DSN: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  
  IYZICO_API_KEY: z.string().optional(),
  IYZICO_SECRET_KEY: z.string().optional(),
  IYZICO_BASE_URL: z.string().default('https://sandbox-api.iyzipay.com'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Yapılandırma Hatası: Ortam değişkenleri doğrulanamadı:');
    for (const error of result.error.errors) {
      console.error(`  - ${error.path.join('.')}: ${error.message}`);
    }
    // Test veya geliştirme ortamında eksik varsa hata fırlat
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  
  return result.success ? result.data : (process.env as unknown as EnvConfig);
}

export const env = loadEnv();
