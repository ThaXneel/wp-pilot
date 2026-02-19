import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, resetPasswordSchema, confirmResetSchema } from './auth.validation.js';

export const authRoutes = Router();

authRoutes.post('/register', validate(registerSchema), authController.register);
authRoutes.post('/login', validate(loginSchema), authController.login);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
authRoutes.post('/reset-password/confirm', validate(confirmResetSchema), authController.confirmReset);
