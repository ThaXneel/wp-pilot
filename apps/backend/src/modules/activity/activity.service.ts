import { prisma } from '../../config/database.js';

export const activityService = {
  async log(clientId: string, action: string, siteId?: string, details?: Record<string, unknown>) {
    return prisma.activity.create({
      data: { clientId, action, siteId, details: details ? JSON.parse(JSON.stringify(details)) : undefined },
    });
  },

  async listForClient(clientId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where: { clientId } }),
    ]);

    return {
      activities,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async listAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { client: { include: { user: { select: { email: true } } } } },
      }),
      prisma.activity.count(),
    ]);

    return {
      activities,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
};
