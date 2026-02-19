import { Router } from 'express';
import { productsController } from './products.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema } from './products.validation.js';

export const productsRoutes = Router();

productsRoutes.use(authenticate, authorize('CLIENT'));

productsRoutes.get('/', productsController.list);
productsRoutes.post('/', validate(createProductSchema), productsController.create);
productsRoutes.put('/:id', validate(updateProductSchema), productsController.update);
