import { Router } from 'express';
import { onboardingController } from './onboarding.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { verifyHandshakeSchema } from './onboarding.validation.js';

export const onboardingRoutes = Router();

// Public endpoints — no JWT required
onboardingRoutes.get('/download-plugin', onboardingController.downloadPlugin);
onboardingRoutes.post('/handshake', validate(verifyHandshakeSchema), onboardingController.handshake);

// Authenticated endpoints
onboardingRoutes.use(authenticate, authorize('CLIENT'));

onboardingRoutes.get('/status', onboardingController.getStatus);
onboardingRoutes.post('/generate-token', onboardingController.generateToken);
onboardingRoutes.post('/verify', onboardingController.verify);
