import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Cache ve Genel İşlemler İçin Redis İstemcisi
export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ için zorunludur
  enableReadyCheck: false,
});

redisConnection.on('connect', () => {
  console.log('⚡️️ [Local Redis] Bağlantı başarıyla sağlandı.');
});

redisConnection.on('error', (err) => {
  console.error('❌ [Local Redis] Bağlantı hatası:', err.message);
});