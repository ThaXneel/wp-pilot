import { Router } from 'express';
import { eventsController } from './events.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const eventsRoutes = Router();

// SSE stream — requires JWT authentication
eventsRoutes.get('/stream', authenticate, eventsController.stream);
