import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../middleware/errorHandler.js';
import { eventBus } from '../events/eventBus.js';

export interface WebhookPayload {
  event: string;
  site_id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export const webhooksService = {
  /**
   * Process an incoming webhook from a WordPress site.
   * Validates the API token, logs the event, and broadcasts via SSE.
   */
  async processWebhook(apiToken: string, eventType: string, payload: WebhookPayload) {
    // Validate the API token against a known site
    const site = await prisma.clientSite.findFirst({
      where: { apiToken },
    });

    if (!site) {
      throw new AppError('Invalid API token', 401);
    }

    const siteName = site.name ?? new URL(site.wpUrl).hostname;

    logger.info(`Webhook received: ${eventType} from site ${siteName} (${site.id})`);

    // Log as activity
    await prisma.activity.create({
      data: {
        clientId: site.clientId,
        siteId: site.id,
        action: `webhook.${eventType}`,
        details: {
          event: eventType,
          timestamp: payload.timestamp,
          summary: buildSummary(eventType, payload.data),
        },
      },
    });

    // Store as global event
    await prisma.globalEvent.create({
      data: {
        siteId: site.id,
        type: categorizeEvent(eventType),
        message: buildSummary(eventType, payload.data),
        metadata: payload.data as object,
      },
    });

    // Update site lastPing since we got a live webhook
    await prisma.clientSite.update({
      where: { id: site.id },
      data: { lastPing: new Date(), status: 'ONLINE' },
    });

    // Broadcast via SSE to connected frontend clients
    eventBus.emit('webhook', {
      clientId: site.clientId,
      siteId: site.id,
      siteName,
      event: eventType,
      data: payload.data,
      timestamp: payload.timestamp,
    });

    return { received: true, event: eventType, siteId: site.id };
  },
};

function categorizeEvent(eventType: string): 'INFO' | 'WARNING' | 'ERROR' {
  if (eventType.includes('deleted')) return 'WARNING';
  if (eventType.includes('error')) return 'ERROR';
  return 'INFO';
}

function buildSummary(eventType: string, data: Record<string, unknown>): string {
  switch (eventType) {
    case 'order.created':
      return `New order #${data.order_id ?? ''} created — $${data.total ?? '0'}`;
    case 'order.status_changed':
      return `Order #${data.order_id ?? ''} status: ${data.old_status ?? ''} → ${data.new_status ?? ''}`;
    case 'product.created':
      return `New product created: ${data.name ?? 'Unknown'}`;
    case 'product.updated':
      return `Product updated: ${data.name ?? 'Unknown'}`;
    case 'product.deleted':
      return `Product deleted (ID: ${data.product_id ?? ''})`;
    case 'post.published':
      return `New post published: ${data.title ?? 'Untitled'}`;
    case 'post.updated':
      return `Post updated: ${data.title ?? 'Untitled'}`;
    case 'comment.created':
      return `New comment on post #${data.post_id ?? ''}`;
    case 'comment.status_changed':
      return `Comment status changed: ${data.old_status ?? ''} → ${data.new_status ?? ''}`;
    default:
      return `Event: ${eventType}`;
  }
}
