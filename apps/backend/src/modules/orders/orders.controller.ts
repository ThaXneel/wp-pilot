import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service.js';

export const ordersController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ordersService.list(req.user!.clientId!);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
