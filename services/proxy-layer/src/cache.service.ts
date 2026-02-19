import RedisModule from 'ioredis';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Redis = (RedisModule as any).default || RedisModule;

export class CacheService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private redis: any;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
    });

    this.redis.on('error', (err: Error) => {
      console.error('[Cache] Redis error:', err.message);
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, value);
    } catch {
      // Cache failures are non-fatal
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch {
      // Cache failures are non-fatal
    }
  }
}
