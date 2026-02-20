import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';

async function resolveActiveSite(clientId: string, siteId?: string) {
  const site = siteId
    ? await prisma.clientSite.findFirst({ where: { id: siteId, clientId } })
    : await prisma.clientSite.findFirst({ where: { clientId, status: 'ONLINE' }, orderBy: { createdAt: 'desc' } });
  if (!site) throw new AppError('No active site found', 404);
  return site;
}

function serviceToken() {
  return jwt.sign({ service: 'backend' }, env.JWT_SECRET, { expiresIn: '60s' });
}

export const postsService = {
  async list(clientId: string, siteId?: string) {
    try {
      const site = await resolveActiveSite(clientId, siteId);
      const token = serviceToken();
      const response = await fetch(`${env.PROXY_URL}/proxy/sites/${site.id}/posts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      return data;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to fetch posts from proxy', { error: (err as Error).message });
      throw new AppError('Failed to fetch posts', 502);
    }
  },

  async create(clientId: string, input: Record<string, unknown>, siteId?: string) {
    try {
      const site = await resolveActiveSite(clientId, siteId);
      const token = serviceToken();
      const response = await fetch(`${env.PROXY_URL}/proxy/sites/${site.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to create post via proxy', { error: (err as Error).message });
      throw new AppError('Failed to create post', 502);
    }
  },

  async update(clientId: string, postId: string, input: Record<string, unknown>, siteId?: string) {
    try {
      const site = await resolveActiveSite(clientId, siteId);
      const token = serviceToken();
      const response = await fetch(`${env.PROXY_URL}/proxy/sites/${site.id}/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to update post via proxy', { error: (err as Error).message });
      throw new AppError('Failed to update post', 502);
    }
  },
};
