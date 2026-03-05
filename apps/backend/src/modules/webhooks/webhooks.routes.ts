import { Router } from 'express';
import { webhooksController } from './webhooks.controller.js';

export const webhooksRoutes = Router();

// Public endpoint — authenticated by API token in Authorization header
// Called by WordPress plugin's OBMAT_Webhooks class
webhooksRoutes.post('/receive', webhooksController.receive);
