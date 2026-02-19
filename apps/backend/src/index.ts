import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { onboardingRoutes } from './modules/onboarding/onboarding.routes.js';
import { sitesRoutes } from './modules/sites/sites.routes.js';
import { productsRoutes } from './modules/products/products.routes.js';
import { ordersRoutes } from './modules/orders/orders.routes.js';
import { postsRoutes } from './modules/posts/posts.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { activityRoutes } from './modules/activity/activity.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/admin', adminRoutes);

// Global error handler
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`🚀 WP Pilot API running on port ${env.PORT} [${env.NODE_ENV}]`);
});

export default app;
