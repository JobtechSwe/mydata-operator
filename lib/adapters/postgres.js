const { Client } = require('pg')
const config = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || '5432',
  user: process.env.PGUSER || 'postgresuser',
  password: process.env.PGPASSWORD || 'postgrespassword',
  database: process.env.PGDATABASE || 'mydata'
}

const wait = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms))

async function connect (attemptNo = 0) {
  try {
    const client = new Client(config)
    await client.connect()
    return client
  } catch (err) {
    console.warn(err)
    const delay = Math.min(1000 * attemptNo, 7000)
    await wait(delay)
    return connect(++attemptNo)
  }
}

module.exports = { connect }
