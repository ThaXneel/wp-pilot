import { Request, Response } from 'express';
import { eventBus } from './eventBus.js';
import { logger } from '../../config/logger.js';

interface SSEEvent {
  clientId: string;
  siteId: string;
  siteName: string;
  event: string;
  data: unknown;
  timestamp: string;
}

export const eventsController = {
  /**
   * SSE stream endpoint.
   * The frontend connects via EventSource to receive real-time updates.
   * Events are filtered by the authenticated user's clientId.
   */
  stream(req: Request, res: Response) {
    const clientId = req.user?.clientId;
    const userId = req.user?.id;

    // Set SSE headers (Railway / nginx / Caddy compatible)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',   // Disable nginx buffering
      'X-Railway-Streaming': '1',  // Tell Railway this is a streaming response
    });

    // Flush headers immediately
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    // Send initial connection event with retry hint (5s reconnect)
    res.write(`retry: 5000\nevent: connected\ndata: ${JSON.stringify({ message: 'SSE connected', userId })}\n\n`);

    // Keep-alive ping every 30 seconds
    const keepAlive = setInterval(() => {
      res.write(`: keep-alive\n\n`);
    }, 30000);

    let eventCounter = 0;

    // Listen for webhook events filtered by clientId
    const onWebhook = (event: SSEEvent) => {
      // Only send events relevant to the connected client
      if (event.clientId !== clientId) return;

      eventCounter++;
      const sseData = JSON.stringify({
        siteId: event.siteId,
        siteName: event.siteName,
        event: event.event,
        data: event.data,
        timestamp: event.timestamp,
      });

      res.write(`id: ${eventCounter}\nevent: webhook\ndata: ${sseData}\n\n`);
    };

    eventBus.on('webhook', onWebhook);

    logger.info(`SSE client connected: user=${userId}, clientId=${clientId}`);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
      eventBus.off('webhook', onWebhook);
      logger.info(`SSE client disconnected: user=${userId}`);
    });
  },
};
