import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service.js';

export const dashboardController = {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const siteId = req.query.siteId as string | undefined;
      const stats = await dashboardService.getStats(req.user!.clientId!, siteId);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },
};
