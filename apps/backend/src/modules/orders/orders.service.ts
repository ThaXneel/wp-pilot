import { env } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';

export const ordersService = {
  async list(clientId: string) {
    try {
      const response = await fetch(`${env.PROXY_URL}/proxy/orders?clientId=${clientId}`);
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error('Failed to fetch orders from proxy', { error: (err as Error).message });
      throw new AppError('Failed to fetch orders', 502);
    }
  },
};
