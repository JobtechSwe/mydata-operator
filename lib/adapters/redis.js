const Redis = require('ioredis')

const connectionString = process.env.REDIS || 'redis://:fubar@localhost:6379/'

const redis = new Redis(connectionString, {
  retryStrategy: (times) => {
    const maxReconnectTime = 50 * 1000
    return Math.min(times * 50, maxReconnectTime)
  }
})
const sub = new Redis(connectionString, {
  retryStrategy: (times) => {
    const maxReconnectTime = 50 * 1000
    return Math.min(times * 50, maxReconnectTime)
  }
})

module.exports = {
  get: async (...args) => redis.get(...args),
  set: async (...args) => redis.set(...args),
  del: async (...args) => redis.del(...args),
  publish: async (...args) => redis.publish(...args),
  expire: async (...args) => redis.expire(...args),
  subscribe: async (...args) => sub.subscribe(...args),
  psubscribe: async (...args) => sub.psubscribe(...args),
  unsubscribe: async (...args) => sub.unsubscribe(...args),
  punsubscribe: async (...args) => sub.punsubscribe(...args),
  on: (...args) => sub.on(...args),
  setJson: async (key, data) => {
    return redis.set(key, JSON.stringify(data))
  },
  getJson: async (key) => {
    const str = await redis.get(key)
    return str ? JSON.parse(str) : str
  }
}
