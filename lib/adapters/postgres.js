const { Client } = require('pg')
const config = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || '5432',
  user: process.env.PGUSER || 'postgresuser',
  password: process.env.PGPASSWORD || 'postgrespassword',
  database: process.env.PGDATABASE || 'mydata'
}

const wait = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms))

async function connect(retries = 0) {
  try {
    const client = new Client(config)
    await client.connect()
    return client
  } catch (err) {
    console.warn(err)
    retries++
    const delay = Math.min(1000 * retries)
    await wait(delay)
    return await connect(retries)
  }
}

module.exports = { connect }
