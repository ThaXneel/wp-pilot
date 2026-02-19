import { env } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';

export const postsService = {
  async list(clientId: string) {
    try {
      const response = await fetch(`${env.PROXY_URL}/proxy/posts?clientId=${clientId}`);
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error('Failed to fetch posts from proxy', { error: (err as Error).message });
      throw new AppError('Failed to fetch posts', 502);
    }
  },

  async create(clientId: string, input: Record<string, unknown>) {
    try {
      const response = await fetch(`${env.PROXY_URL}/proxy/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, ...input }),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error('Failed to create post via proxy', { error: (err as Error).message });
      throw new AppError('Failed to create post', 502);
    }
  },

  async update(clientId: string, postId: string, input: Record<string, unknown>) {
    try {
      const response = await fetch(`${env.PROXY_URL}/proxy/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, ...input }),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error('Failed to update post via proxy', { error: (err as Error).message });
      throw new AppError('Failed to update post', 502);
    }
  },
};
