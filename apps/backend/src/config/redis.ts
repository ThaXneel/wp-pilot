import RedisModule from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Redis = (RedisModule as any).default || RedisModule;

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err: Error) => {
  logger.error('Redis connection error', { error: err.message });
});
