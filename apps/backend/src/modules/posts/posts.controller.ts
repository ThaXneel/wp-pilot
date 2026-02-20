import { Request, Response, NextFunction } from 'express';
import { postsService } from './posts.service.js';

export const postsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await postsService.list(req.user!.clientId!, req.query.siteId as string | undefined);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { siteId, ...input } = req.body;
      const data = await postsService.create(req.user!.clientId!, input, siteId);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { siteId, ...input } = req.body;
      const data = await postsService.update(req.user!.clientId!, req.params.id as string, input, siteId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
