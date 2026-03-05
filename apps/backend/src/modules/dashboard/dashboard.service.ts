import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';

export const dashboardService = {
  async getStats(clientId: string, selectedSiteId?: string) {
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
          lastPing: true,
          wpVersion: true,
          errorCount: true,
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

      // Use selected site, or first active site for counts
      const targetSite = selectedSiteId
        ? rawSites.find((s) => s.id === selectedSiteId)
        : rawSites.find((s) => s.status === 'ONLINE') ?? rawSites[0];

      if (targetSite) {
        try {
          const token = jwt.sign({ service: 'backend' }, env.JWT_SECRET, { expiresIn: '60s' });
          const headers = { Authorization: `Bearer ${token}` };

          const [productsRes, ordersRes, postsRes] = await Promise.all([
            fetch(`${env.PROXY_URL}/proxy/sites/${targetSite.id}/products/count`, { headers }),
            fetch(`${env.PROXY_URL}/proxy/sites/${targetSite.id}/orders/count`, { headers }),
            fetch(`${env.PROXY_URL}/proxy/sites/${targetSite.id}/posts/count`, { headers }),
          ]);

          if (productsRes.ok) productCount = ((await productsRes.json()) as { count?: number }).count ?? 0;
          if (ordersRes.ok) orderCount = ((await ordersRes.json()) as { count?: number }).count ?? 0;
          if (postsRes.ok) postCount = ((await postsRes.json()) as { count?: number }).count ?? 0;
        } catch {
          logger.warn('Could not fetch counts from proxy — using defaults');
        }
      }

      return {
        sites,
        productCount,
        orderCount,
        postCount,
        recentActivity,
        siteStats: await this.getPerSiteStats(rawSites, env),
      };
    } catch (err) {
      logger.error('Dashboard stats error', { error: (err as Error).message });
      throw err;
    }
  },

  /**
   * Fetch per-site product/order/post counts from the proxy layer.
   * Returns { [siteId]: { products, orders, posts } }
   */
  async getPerSiteStats(
    sites: Array<{ id: string; status: string }>,
    envConfig: typeof env,
  ): Promise<Record<string, { products: number; orders: number; posts: number }>> {
    const result: Record<string, { products: number; orders: number; posts: number }> = {};

    const onlineSites = sites.filter((s) => s.status === 'ONLINE');
    if (onlineSites.length === 0) return result;

    const token = jwt.sign({ service: 'backend' }, envConfig.JWT_SECRET, { expiresIn: '60s' });
    const headers = { Authorization: `Bearer ${token}` };

    await Promise.all(
      onlineSites.map(async (site) => {
        try {
          const [productsRes, ordersRes, postsRes] = await Promise.all([
            fetch(`${envConfig.PROXY_URL}/proxy/sites/${site.id}/products/count`, { headers, signal: AbortSignal.timeout(5000) }),
            fetch(`${envConfig.PROXY_URL}/proxy/sites/${site.id}/orders/count`, { headers, signal: AbortSignal.timeout(5000) }),
            fetch(`${envConfig.PROXY_URL}/proxy/sites/${site.id}/posts/count`, { headers, signal: AbortSignal.timeout(5000) }),
          ]);

          result[site.id] = {
            products: productsRes.ok ? ((await productsRes.json()) as { count?: number }).count ?? 0 : 0,
            orders: ordersRes.ok ? ((await ordersRes.json()) as { count?: number }).count ?? 0 : 0,
            posts: postsRes.ok ? ((await postsRes.json()) as { count?: number }).count ?? 0 : 0,
          };
        } catch {
          result[site.id] = { products: 0, orders: 0, posts: 0 };
        }
      }),
    );

    return result;
  },
};
