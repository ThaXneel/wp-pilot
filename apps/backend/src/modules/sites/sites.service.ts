import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';

export const sitesService = {
  async getSiteConfig(siteId: string) {
    const site = await prisma.clientSite.findUnique({
      where: { id: siteId },
      select: { wpUrl: true, apiToken: true },
    });
    if (!site) throw new AppError('Site not found', 404);
    return site;
  },

  async listSites(clientId?: string) {
    const where = clientId ? { clientId } : {};
    return prisma.clientSite.findMany({
      where,
      select: {
        id: true,
        clientId: true,
        name: true,
        wpUrl: true,
        status: true,
        healthScore: true,
        errorCount: true,
        wpVersion: true,
        lastPing: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getSite(siteId: string, clientId?: string) {
    const site = await prisma.clientSite.findUnique({
      where: { id: siteId },
      select: {
        id: true,
        clientId: true,
        name: true,
        wpUrl: true,
        status: true,
        healthScore: true,
        errorCount: true,
        wpVersion: true,
        lastPing: true,
        createdAt: true,
        updatedAt: true,
      },
    });

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

  async deleteSite(siteId: string, clientId?: string) {
    const site = await prisma.clientSite.findUnique({ where: { id: siteId } });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    if (clientId && site.clientId !== clientId) {
      throw new AppError('Site not found', 404);
    }

    // Delete site (cascading will remove related activities and globalEvents)
    await prisma.clientSite.delete({ where: { id: siteId } });

    // Log the deletion as an activity
    await prisma.activity.create({
      data: {
        clientId: site.clientId,
        action: 'site.deleted',
        details: { siteName: site.name, wpUrl: site.wpUrl },
      },
    });

    logger.info(`Site deleted: ${site.name} (${site.id}) by client ${site.clientId}`);

    return { id: siteId, name: site.name };
  },
};
