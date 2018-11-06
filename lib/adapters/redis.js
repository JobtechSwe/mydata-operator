const Redis = require('ioredis')

function log(...args) {
  args
    .map(a => JSON.stringify(a))
    .forEach(t => process.stdout.write(t + ' '))
  process.stdout.write('\n')
}

const connectionString = 'redis://:fubar@localhost:6379/' || process.env.REDIS

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
  get: async (...args) => await redis.get(...args),
  set: async (...args) => await redis.set(...args),
  del: async (...args) => await redis.del(...args),
  publish: async (...args) => await redis.publish(...args),
  expire: async (...args) => await redis.expire(...args),
  subscribe: async (...args) => await sub.subscribe(...args),
  psubscribe: async (...args) => await sub.psubscribe(...args),
  unsubscribe: async (...args) => await sub.unsubscribe(...args),
  punsubscribe: async (...args) => await sub.punsubscribe(...args),
  on: (...args) => sub.on(...args),
  setJson: async (key, data) => {
    return await redis.set(key, JSON.stringify(data))
  },
  getJson: async (key) => {
    const str = await redis.get(key)
    return JSON.parse(str)
  }
}
