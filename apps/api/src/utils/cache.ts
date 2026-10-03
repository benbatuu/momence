import { redisConnection } from './redis';

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisConnection.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await redisConnection.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      console.error(`[Cache SET Error] Key: ${key}`, err);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redisConnection.del(key);
    } catch (err) {
      console.error(`[Cache DEL Error] Key: ${key}`, err);
    }
  }

  static async invalidateStudioCache(studioId: string): Promise<void> {
    try {
      const keys = await redisConnection.keys(`studio:${studioId}:*`);
      if (keys.length > 0) {
        await redisConnection.del(...keys);
      }
    } catch (err) {
      console.error(`[Cache Invalidate Error] Studio: ${studioId}`, err);
    }
  }
}