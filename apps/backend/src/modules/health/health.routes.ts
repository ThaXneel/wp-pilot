import { Router } from 'express';
import { healthController } from './health.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const healthRoutes = Router();

healthRoutes.get('/', healthController.basic);
healthRoutes.get('/db', healthController.database);
healthRoutes.get('/redis', healthController.redis);
healthRoutes.get('/detailed', authenticate, authorize('OWNER'), healthController.detailed);
