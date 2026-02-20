import { Request, Response, NextFunction } from 'express';
import { sitesService } from './sites.service.js';

export const sitesController = {
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const internalHeader = req.headers['x-internal-service'];
      if (internalHeader !== 'proxy-layer') {
        res.status(401).json({ error: 'Unauthorized internal request' });
        return;
      }
      const config = await sitesService.getSiteConfig(req.params.id as string);
      res.json(config);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = req.user?.role === 'CLIENT' ? req.user.clientId : undefined;
      const sites = await sitesService.listSites(clientId);
      res.json({ success: true, data: sites });
    } catch (err) {
      next(err);
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = req.user?.role === 'CLIENT' ? req.user.clientId : undefined;
      const site = await sitesService.getSite(req.params.id as string, clientId);
      res.json({ success: true, data: site });
    } catch (err) {
      next(err);
    }
  },

  async heartbeat(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sitesService.processHeartbeat(req.body);
      res.json({ success: true, data: { status: result.status } });
    } catch (err) {
      next(err);
    }
  },
};
