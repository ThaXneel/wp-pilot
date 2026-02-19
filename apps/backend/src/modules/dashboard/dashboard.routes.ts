import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate, authorize('CLIENT'));
dashboardRoutes.get('/stats', dashboardController.getStats);
