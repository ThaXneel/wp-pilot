import { env } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';

export const productsService = {
  async list(clientId: string) {
    try {
      const response = await fetch(`${env.PROXY_URL}/proxy/products?clientId=${clientId}`);
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error('Failed to fetch products from proxy', { error: (err as Error).message });
      throw new AppError('Failed to fetch products', 502);
    }
  },

  async create(clientId: string, input: Record<string, unknown>) {
    try {
      const response = await fetch(`${env.PROXY_URL}/proxy/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, ...input }),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error('Failed to create product via proxy', { error: (err as Error).message });
      throw new AppError('Failed to create product', 502);
    }
  },

  async update(clientId: string, productId: string, input: Record<string, unknown>) {
    try {
      const response = await fetch(`${env.PROXY_URL}/proxy/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, ...input }),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error('Failed to update product via proxy', { error: (err as Error).message });
      throw new AppError('Failed to update product', 502);
    }
  },
};
