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

      // Handle non-JSON responses (e.g. when WP returns HTML error pages)
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        logger.error('Non-JSON response from proxy for orders', {
          siteId: site.id,
          wpUrl: site.wpUrl,
          status: response.status,
        });
        throw new AppError(
          'WordPress site returned an error while fetching orders. Please check that WooCommerce is active and the OBMAT plugin is up to date.',
          502,
        );
      }

      const data = await response.json();

      // If proxy returned an error object, forward it
      if (!response.ok) {
        logger.error('Proxy returned error for orders', {
          siteId: site.id,
          wpUrl: site.wpUrl,
          status: response.status,
          data,
        });
        throw new AppError(
          (data as { error?: string }).error || 'Failed to fetch orders from WordPress site',
          response.status >= 500 ? 502 : response.status,
        );
      }

      return data;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to fetch orders from proxy', { error: (err as Error).message });
      throw new AppError('Failed to fetch orders', 502);
    }
  },
};
