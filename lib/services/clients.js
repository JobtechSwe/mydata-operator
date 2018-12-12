const { connect } = require('../adapters/postgres')

async function create ({ clientId, displayName, description, jwksUrl }, publicKey) {
  const conn = await connect()
  try {
    const result = await conn.query(`
      INSERT INTO clients(client_id, display_name, description, jwks_url, public_key)
      VALUES($1, $2, $3, $4, $5)
      ON CONFLICT (client_id)
      DO
        UPDATE SET
          display_name = $2,
          description = $3,
          jwks_url = $4,
          public_key = $5

    `, [clientId, displayName, description, jwksUrl, publicKey])

    if (result.rowCount !== 1) {
      throw Error('Incorrect numbers of rows updated')
    }
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

    return result.rows[0]
  } finally {
    conn.end()
  }
}

module.exports = {
  create,
  get
}
