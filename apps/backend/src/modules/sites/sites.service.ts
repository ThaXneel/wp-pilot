import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';

export const sitesService = {
  async listSites(clientId?: string) {
    const where = clientId ? { clientId } : {};
    return prisma.clientSite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },

  async getSite(siteId: string, clientId?: string) {
    const site = await prisma.clientSite.findUnique({ where: { id: siteId } });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    if (clientId && site.clientId !== clientId) {
      throw new AppError('Site not found', 404);
    }

    return site;
  },

  async processHeartbeat(data: { siteId: string; apiToken: string; wpVersion?: string; healthScore?: number; errorCount?: number }) {
    const site = await prisma.clientSite.findUnique({ where: { id: data.siteId } });

    if (!site || site.apiToken !== data.apiToken) {
      throw new AppError('Invalid site or token', 401);
    }

    const updated = await prisma.clientSite.update({
      where: { id: data.siteId },
      data: {
        lastPing: new Date(),
        status: 'ONLINE',
        wpVersion: data.wpVersion ?? site.wpVersion,
        healthScore: data.healthScore ?? site.healthScore,
        errorCount: data.errorCount ?? site.errorCount,
      },
    });

    return updated;
  },
};
