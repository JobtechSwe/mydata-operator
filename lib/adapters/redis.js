const Redis = require('ioredis')

const connectionString = 'redis://:fubar@localhost:6379/' || process.env.REDIS
const redis = new Redis(connectionString, {
  retryStrategy: (times) => {
    const maxReconnectTime = 50 * 1000
    return Math.min(times * 50, maxReconnectTime)
  }
})
Object.assign(redis, {
  setJson: async (key, data) => {
    return await redis.set(key, JSON.stringify(data))
  },
  getJson: async (key) => {
    const str = await redis.get(key)
    return JSON.parse(str)
  }
})

module.exports = redis
