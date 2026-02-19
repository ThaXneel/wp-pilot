import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import type { AuthUser } from './authenticate.js';

type Role = 'OWNER' | 'CLIENT';

export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user as AuthUser;

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};
