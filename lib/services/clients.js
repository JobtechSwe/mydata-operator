const { connect } = require('../adapters/postgres')
const { camelCase } = require('changecase-objects')

async function create ({ clientId, displayName, description, eventsUrl, jwksUrl, publicKey }) {
  const conn = await connect()
  try {
    const result = await conn.query(`
      INSERT INTO clients(
        client_id,
        display_name,
        description,
        jwks_url,
        events_url,
        public_key)
      VALUES($1, $2, $3, $4, $5, $6)
      ON CONFLICT (client_id)
      DO
        UPDATE SET
          display_name = $2,
          description = $3,
          jwks_url = $4,
          events_url = $5,
          public_key = $6

    `, [clientId, displayName, description, jwksUrl, eventsUrl, publicKey])

    if (result.rowCount !== 1) {
      throw Error('Incorrect numbers of rows updated')
    }

    return camelCase({ clientId, displayName, description, eventsUrl, jwksUrl, publicKey })
  } finally {
    conn.end()
  }
}

async function get (clientId) {
  const conn = await connect()
  try {
    const result = await conn.query(`
      SELECT * FROM clients
      WHERE client_id = $1
    `, [clientId])

    return camelCase(result.rows[0])
  } finally {
    conn.end()
  }
}

module.exports = {
  create,
  get
}
