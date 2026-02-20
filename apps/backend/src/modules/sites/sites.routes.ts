import { Router } from 'express';
import { sitesController } from './sites.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const sitesRoutes = Router();

// Internal endpoint for proxy-layer (no JWT, verified by X-Internal-Service header)
sitesRoutes.get('/:id/config', sitesController.getConfig);

sitesRoutes.post('/heartbeat', sitesController.heartbeat); // No auth — uses apiToken
sitesRoutes.use(authenticate);
sitesRoutes.get('/', sitesController.list);
sitesRoutes.get('/:id', sitesController.get);
