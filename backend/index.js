/**
 * MediFlow Prototype — Root Launcher
 * ===================================
 * Boots all 4 microservices in a single Node.js process.
 *
 * WHY: The in-memory EventBus (Node EventEmitter) only works when
 * all services share the same process. This launcher loads each
 * service's dotenv config and server in sequence, ensuring the
 * Write Service's eventBus singleton is shared with the Read Service.
 *
 * HOW TO RUN:
 *   node index.js
 *   OR
 *   nodemon index.js
 *
 * PRODUCTION NOTE:
 * In production, replace the EventBus with Kafka and run each
 * service as a separate Docker container (see docker-compose.yml).
 * Each service can then be started independently with `npm start`.
 */

const path = require('path');

// ─── Load each service's env before requiring its server ───────────────────

// Auth Service
require('dotenv').config({ path: path.join(__dirname, 'auth-service', '.env') });
require('./auth-service/src/server');

// Sync Service
require('dotenv').config({ path: path.join(__dirname, 'sync-service', '.env') });
require('./sync-service/src/server');

// Write Service
require('dotenv').config({ path: path.join(__dirname, 'write-service', '.env') });
require('./write-service/src/server');

// Read Service — must load AFTER write-service so eventBus module is cached
require('dotenv').config({ path: path.join(__dirname, 'read-service', '.env') });
require('./read-service/src/server');

console.log('\n🚀 MediFlow Prototype — All services started');
console.log('   Auth Service  → http://localhost:5001');
console.log('   Sync Service  → http://localhost:5002');
console.log('   Write Service → http://localhost:5003');
console.log('   Read Service  → http://localhost:5004\n');
