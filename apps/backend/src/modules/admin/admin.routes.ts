import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createClientSchema, updateClientStatusSchema, updateEmailSettingsSchema } from './admin.validation.js';

export const adminRoutes = Router();

adminRoutes.use(authenticate, authorize('OWNER'));

adminRoutes.get('/overview', adminController.overview);
adminRoutes.get('/clients', adminController.listClients);
adminRoutes.post('/clients', validate(createClientSchema), adminController.createClient);
adminRoutes.put('/clients/:id/status', validate(updateClientStatusSchema), adminController.updateClientStatus);
adminRoutes.get('/sites', adminController.listSites);
adminRoutes.get('/activity', adminController.listActivity);
adminRoutes.get('/errors', adminController.listErrors);
adminRoutes.get('/settings/email', adminController.getEmailSettings);
adminRoutes.put('/settings/email', validate(updateEmailSettingsSchema), adminController.updateEmailSettings);
