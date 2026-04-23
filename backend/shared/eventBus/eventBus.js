const { EventEmitter } = require('events');

/**
 * MediFlow In-Memory Event Bus (Prototype)
 * Production replacement: Apache Kafka
 *
 * Usage:
 *   const eventBus = require('../shared/eventBus/eventBus');
 *   eventBus.publish('PatientDataSynced', payload);
 *   eventBus.subscribe('PatientDataSynced', handler);
 */

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Increase for multiple subscribers
  }

  publish(eventName, payload) {
    console.log(`[EventBus] Publishing event: ${eventName}`, JSON.stringify(payload, null, 2));
    this.emit(eventName, payload);
  }

  subscribe(eventName, handler) {
    console.log(`[EventBus] Subscriber registered for: ${eventName}`);
    this.on(eventName, handler);
  }
}

// Singleton instance
const eventBus = new EventBus();

module.exports = eventBus;
