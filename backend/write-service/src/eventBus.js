/**
 * Write Service uses its own instance of the in-memory EventBus.
 * The Read Service must run in the SAME Node.js process (monorepo mode)
 * OR this is replaced with Kafka in production.
 *
 * For prototype multi-process mode: the event bus is exported from this
 * module and the read-service registers its subscriber on startup
 * by requiring this same singleton (only works in-process).
 *
 * See README.md for production Kafka upgrade path.
 */
const { EventEmitter } = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  publish(eventName, payload) {
    console.log(`[EventBus] Event published: ${eventName}`);
    console.log('[EventBus] Payload:', JSON.stringify(payload, null, 2));
    this.emit(eventName, payload);
  }

  subscribe(eventName, handler) {
    console.log(`[EventBus] Subscriber registered for: ${eventName}`);
    this.on(eventName, handler);
  }
}

const eventBus = new EventBus();
module.exports = eventBus;
