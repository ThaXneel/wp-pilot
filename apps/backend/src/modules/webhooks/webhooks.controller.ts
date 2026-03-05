import { Request, Response, NextFunction } from 'express';
import { webhooksService } from './webhooks.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export const webhooksController = {
  async receive(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract Bearer token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError('Missing or invalid Authorization header', 401);
      }
      const apiToken = authHeader.split(' ')[1];

      // Extract event type from custom header
      const eventType = req.headers['x-obmat-event'] as string;
      if (!eventType) {
        throw new AppError('Missing X-OBMAT-Event header', 400);
      }

      const result = await webhooksService.processWebhook(apiToken, eventType, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
