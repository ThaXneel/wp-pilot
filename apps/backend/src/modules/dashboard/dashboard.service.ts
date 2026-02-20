import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';

export const dashboardService = {
  async getStats(clientId: string) {
    try {
      // Get sites with full details for the dashboard
      const rawSites = await prisma.clientSite.findMany({
        where: { clientId },
        select: {
          id: true,
          name: true,
          wpUrl: true,
          status: true,
          healthScore: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Ensure every site has a display name (fallback to hostname from wpUrl)
      const sites = rawSites.map((s) => ({
        ...s,
        name: s.name || new URL(s.wpUrl).hostname,
      }));

      // Get recent activity count
      const recentActivity = await prisma.activity.count({
        where: {
          clientId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      // Try to get product/order/post counts from proxy (graceful fallback)
      let productCount = 0;
      let orderCount = 0;
      let postCount = 0;

      try {
        const [productsRes, ordersRes, postsRes] = await Promise.all([
          fetch(`${env.PROXY_URL}/proxy/products/count?clientId=${clientId}`),
          fetch(`${env.PROXY_URL}/proxy/orders/count?clientId=${clientId}`),
          fetch(`${env.PROXY_URL}/proxy/posts/count?clientId=${clientId}`),
        ]);

        if (productsRes.ok) productCount = ((await productsRes.json()) as { count?: number }).count ?? 0;
        if (ordersRes.ok) orderCount = ((await ordersRes.json()) as { count?: number }).count ?? 0;
        if (postsRes.ok) postCount = ((await postsRes.json()) as { count?: number }).count ?? 0;
      } catch {
        logger.warn('Could not fetch counts from proxy — using defaults');
      }

      return {
        sites,
        productCount,
        orderCount,
        postCount,
        recentActivity,
      };
    } catch (err) {
      logger.error('Dashboard stats error', { error: (err as Error).message });
      throw err;
    }
  },
};
