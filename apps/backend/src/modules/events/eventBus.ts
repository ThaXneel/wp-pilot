import { EventEmitter } from 'events';

/**
 * In-process event bus for SSE broadcasting.
 * Webhook service emits events here, SSE stream controller listens.
 *
 * For horizontal scaling across multiple backend instances,
 * replace with Redis Pub/Sub (the Redis connection is already available).
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Allow many concurrent SSE connections
  }
}

export const eventBus = new EventBus();
