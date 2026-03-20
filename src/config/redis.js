const Redis = require("ioredis");

let redisClient = null;

const connectRedis = () => {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.log("⚠️  Redis not configured — running without cache");
    return null;
  }

  const config = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL, tls: { rejectUnauthorized: false } }
    : {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      };

  const client = new Redis({
    ...config,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 3000);
    },
    lazyConnect: true,
  });

  client.on("connect", () => console.log("✅ Redis connected"));
  client.on("error", (err) => console.error("❌ Redis error:", err.message));

  client.connect().catch((err) => {
    console.error("Redis initial connection failed:", err.message);
  });

  redisClient = client;
  return client;
};

const getRedis = () => redisClient;

const setCache = async (key, value, ttlSeconds = 3600) => {
  try {
    const client = getRedis();
    if (!client) return;
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error("Redis SET error:", err.message);
  }
};

const getCache = async (key) => {
  try {
    const client = getRedis();
    if (!client) return null;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis GET error:", err.message);
    return null;
  }
};

const deleteCache = async (key) => {
  try {
    const client = getRedis();
    if (!client) return;
    await client.del(key);
  } catch (err) {
    console.error("Redis DEL error:", err.message);
  }
};

const deleteCacheByPattern = async (pattern) => {
  try {
    const client = getRedis();
    if (!client) return;
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(...keys);
  } catch (err) {
    console.error("Redis pattern DEL error:", err.message);
  }
};

module.exports = { connectRedis, getRedis, setCache, getCache, deleteCache, deleteCacheByPattern };
