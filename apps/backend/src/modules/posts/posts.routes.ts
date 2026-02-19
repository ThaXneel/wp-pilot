import { Router } from 'express';
import { postsController } from './posts.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createPostSchema, updatePostSchema } from './posts.validation.js';

export const postsRoutes = Router();

postsRoutes.use(authenticate, authorize('CLIENT'));

postsRoutes.get('/', postsController.list);
postsRoutes.post('/', validate(createPostSchema), postsController.create);
postsRoutes.put('/:id', validate(updatePostSchema), postsController.update);
