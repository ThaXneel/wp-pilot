import { Router } from 'express';
import { ordersController } from './orders.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const ordersRoutes = Router();

ordersRoutes.use(authenticate, authorize('CLIENT'));
ordersRoutes.get('/', ordersController.list);
