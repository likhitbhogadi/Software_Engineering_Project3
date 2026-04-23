const { createClient } = require('redis');

const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';

const redisClient = createClient({ url: REDIS_URI });

redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redisClient.on('connect', () => {
  console.log(`[Redis] Connected to ${REDIS_URI}`);
});

// Connect eagerly — called once when this module is first required
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('[Redis] Initial connection failed:', err.message);
  }
})();

module.exports = redisClient;
