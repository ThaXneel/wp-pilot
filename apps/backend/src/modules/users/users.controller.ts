import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service.js';

export const usersController = {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getProfile(req.user!.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateProfile(req.user!.id, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const prefs = await usersService.updatePreferences(req.user!.id, req.body);
      res.json({ success: true, data: prefs });
    } catch (err) {
      next(err);
    }
  },
};
