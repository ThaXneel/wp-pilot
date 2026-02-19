import { Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';

export const healthController = {
  async basic(_req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    });
  },

  async database(_req: Request, res: Response) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        success: true,
        data: { status: 'connected' },
      });
    } catch {
      res.status(503).json({
        success: false,
        error: 'Database connection failed',
      });
    }
  },

  async redis(_req: Request, res: Response) {
    try {
      const pong = await redis.ping();
      res.json({
        success: true,
        data: { status: pong === 'PONG' ? 'connected' : 'error' },
      });
    } catch {
      res.status(503).json({
        success: false,
        error: 'Redis connection failed',
      });
    }
  },

  async detailed(_req: Request, res: Response) {
    const checks: Record<string, string> = {};

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'connected';
    } catch {
      checks.database = 'disconnected';
    }

    try {
      const pong = await redis.ping();
      checks.redis = pong === 'PONG' ? 'connected' : 'error';
    } catch {
      checks.redis = 'disconnected';
    }

    const allHealthy = Object.values(checks).every((v) => v === 'connected');

    res.status(allHealthy ? 200 : 503).json({
      success: true,
      data: {
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    });
  },
};
