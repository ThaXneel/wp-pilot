import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateClientInput, UpdateClientStatusInput } from './admin.validation.js';

export const adminService = {
  async getOverview() {
    const [totalClients, totalSites, sitesOnline, sitesOffline, recentErrors] = await Promise.all([
      prisma.client.count(),
      prisma.clientSite.count(),
      prisma.clientSite.count({ where: { status: 'ONLINE' } }),
      prisma.clientSite.count({ where: { status: 'OFFLINE' } }),
      prisma.globalEvent.count({
        where: {
          type: 'ERROR',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      clients: totalClients,
      sites: { total: totalSites, online: sitesOnline, offline: sitesOffline },
      errorsLast24h: recentErrors,
    };
  },

  async listClients(search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = search
      ? { user: { email: { contains: search, mode: 'insensitive' as const } } }
      : {};

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, createdAt: true } },
          _count: { select: { sites: true } },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      clients,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async createClient(input: CreateClientInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: 'CLIENT',
        client: {
          create: {
            plan: input.plan,
            status: 'ACTIVE',
          },
        },
      },
      include: { client: true },
    });

    return { userId: user.id, clientId: user.client!.id, email: user.email };
  },

  async updateClientStatus(clientId: string, input: UpdateClientStatusInput) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    return prisma.client.update({
      where: { id: clientId },
      data: { status: input.status },
    });
  },

  async listSites(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [sites, total] = await Promise.all([
      prisma.clientSite.findMany({
        skip,
        take: limit,
        orderBy: { lastPing: 'desc' },
        include: {
          client: { include: { user: { select: { email: true } } } },
        },
      }),
      prisma.clientSite.count(),
    ]);

    return {
      sites,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async listErrors(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [errors, total] = await Promise.all([
      prisma.globalEvent.findMany({
        where: { type: 'ERROR' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { site: { select: { wpUrl: true } } },
      }),
      prisma.globalEvent.count({ where: { type: 'ERROR' } }),
    ]);

    return {
      errors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
};
