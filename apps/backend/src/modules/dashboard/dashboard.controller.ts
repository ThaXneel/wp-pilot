import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service.js';

export const dashboardController = {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getStats(req.user!.clientId!);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },
};
