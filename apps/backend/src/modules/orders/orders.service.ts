import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';

export const ordersService = {
  async list(clientId: string, siteId?: string) {
    try {
      const site = siteId
        ? await prisma.clientSite.findFirst({ where: { id: siteId, clientId } })
        : await prisma.clientSite.findFirst({ where: { clientId, status: 'ONLINE' }, orderBy: { createdAt: 'desc' } });
      if (!site) throw new AppError('No active site found', 404);

      const token = jwt.sign({ service: 'backend' }, env.JWT_SECRET, { expiresIn: '60s' });
      const response = await fetch(`${env.PROXY_URL}/proxy/sites/${site.id}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      return data;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to fetch orders from proxy', { error: (err as Error).message });
      throw new AppError('Failed to fetch orders', 502);
    }
  },
};
