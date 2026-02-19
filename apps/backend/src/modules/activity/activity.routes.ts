import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { activityService } from './activity.service.js';
import { authenticate } from '../../middleware/authenticate.js';

export const activityRoutes = Router();

activityRoutes.use(authenticate);

activityRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const clientId = req.user?.role === 'CLIENT' ? req.user.clientId! : undefined;
    const result = clientId
      ? await activityService.listForClient(clientId, page, limit)
      : await activityService.listAll(page, limit);

    res.json({ success: true, data: result.activities, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
});
