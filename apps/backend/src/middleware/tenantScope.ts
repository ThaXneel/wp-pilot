import { Request, Response, NextFunction } from 'express';
import type { AuthUser } from './authenticate.js';

/**
 * Inject clientId filter for CLIENT role queries.
 * Ensures row-level tenant isolation — clients can only
 * access their own data.
 */
export const tenantScope = (req: Request, _res: Response, next: NextFunction): void => {
  const user = req.user as AuthUser;

  if (user?.role === 'CLIENT' && user.clientId) {
    // Attach client scope that services can reference
    (req as any).tenantClientId = user.clientId;
  }

  next();
};
