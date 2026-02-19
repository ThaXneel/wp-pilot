import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema, updatePreferencesSchema } from './users.validation.js';

export const usersRoutes = Router();

usersRoutes.use(authenticate);

usersRoutes.get('/profile', usersController.getProfile);
usersRoutes.put('/profile', validate(updateProfileSchema), usersController.updateProfile);
usersRoutes.patch('/preferences', validate(updatePreferencesSchema), usersController.updatePreferences);
