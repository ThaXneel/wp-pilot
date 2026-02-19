import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';
import { activityService } from '../activity/activity.service.js';

export const adminController = {
  async overview(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getOverview();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async listClients(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await adminService.listClients(search, page, limit);
      res.json({ success: true, data: result.clients, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  },

  async createClient(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.createClient(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async updateClientStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.updateClientStatus(req.params.id as string, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async listSites(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await adminService.listSites(page, limit);
      res.json({ success: true, data: result.sites, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  },

  async listActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await activityService.listAll(page, limit);
      res.json({ success: true, data: result.activities, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  },

  async listErrors(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await adminService.listErrors(page, limit);
      res.json({ success: true, data: result.errors, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  },
};
