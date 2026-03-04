import { Router } from 'express';
import { ordersController } from './orders.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenantScope } from '../../middleware/tenantScope.js';

export const ordersRoutes = Router();

ordersRoutes.use(authenticate, authorize('CLIENT'), tenantScope);
ordersRoutes.get('/', ordersController.list);
