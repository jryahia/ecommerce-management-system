const redis = require('redis');
const logger = require('../utils/logger');

let client = null;
let isConnected = false;
let connectionAttempted = false;

const isRedisDisabled = process.env.REDIS_DISABLED === 'true';

// In-memory fallback cache when Redis is unavailable
const memCache = new Map();

async function initializeRedis() {
  if (connectionAttempted || isRedisDisabled) {
    if (isRedisDisabled) {
      logger.info('Redis is disabled via REDIS_DISABLED=true — using in-memory cache');
    }
    return;
  }

  connectionAttempted = true;
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    client = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('Redis reconnection failed after 3 attempts — falling back to in-memory cache');
            return false;
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    client.on('connect', () => {
      isConnected = true;
      logger.info('Connected to Redis');
    });

    client.on('error', (err) => {
      if (isConnected) {
        logger.warn(`Redis error — falling back to in-memory cache: ${err.message}`);
      }
      isConnected = false;
    });

    client.on('end', () => {
      isConnected = false;
    });

    await client.connect();
  } catch (err) {
    logger.warn(`Redis connection failed: ${err.message} — using in-memory cache`);
    client = null;
    isConnected = false;
  }
}

initializeRedis().catch(() => {});

const cache = {
  async get(key) {
    if (!isConnected || !client) {
      const entry = memCache.get(key);
      if (!entry) return null;
      if (entry.expires && Date.now() > entry.expires) {
        memCache.delete(key);
        return null;
      }
      return entry.value;
    }
    try {
      return await client.get(key);
    } catch (err) {
      logger.error('Redis GET error:', err.message);
      return null;
    }
  },

  async set(key, value, ttlSeconds = null) {
    if (!isConnected || !client) {
      const entry = { value };
      if (ttlSeconds) entry.expires = Date.now() + ttlSeconds * 1000;
      memCache.set(key, entry);
      return true;
    }
    try {
      if (ttlSeconds) {
        await client.setEx(key, ttlSeconds, value);
      } else {
        await client.set(key, value);
      }
      return true;
    } catch (err) {
      logger.error('Redis SET error:', err.message);
      return false;
    }
  },

  async del(key) {
    if (!isConnected || !client) {
      memCache.delete(key);
      return true;
    }
    try {
      await client.del(key);
      return true;
    } catch (err) {
      logger.error('Redis DEL error:', err.message);
      return false;
    }
  },

  isConnected() {
    return isConnected;
  },
};

module.exports = cache;
module.exports.client = client;
module.exports.isConnected = () => isConnected;
