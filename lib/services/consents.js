const moment = require('moment')
const redis = require('../adapters/redis')
const { connect } = require('../adapters/postgres')
const { v4 } = require('uuid')
const axios = require('axios')
const { camelCase } = require('changecase-objects')
const schemas = require('./schemas')
const { createToken } = require('./jwt')

async function createRequest (data, signature) {
  await schemas.consentRequest.validate(data, schemas.defaultOptions)

  let id, result, expires
  let tries = 0
  do {
    id = v4()
    const redisData = JSON.stringify({ data, signature })
    const expireInSeconds = 3600
    result = await redis.set(`consentRequest:${id}`, redisData, 'NX', 'EX', expireInSeconds)
    expires = moment().add(expireInSeconds, 'seconds').format('X')

    if (tries++ > 10) {
      throw Error('max tries when setting consentRequest in redis')
    }
  } while (result !== 'OK')

  return {
    id,
    expires
  }
}

async function getRequest (id) {
  const reqStr = await redis.get(`consentRequest:${id}`)
  if (!reqStr) {
    return
  }
  const { data, signature } = JSON.parse(reqStr)
  return {
    data,
    signature: {
      alg: signature.alg,
      kid: signature.kid,
      data: signature.data
    },
    client: {
      jwksUrl: signature.client.jwksUrl,
      displayName: signature.client.displayName,
      description: signature.client.description
    }
  }
}

function columnIndices (columns) {
  return columns.split(', ').map((_, ix) => `$${ix + 1}`).join(', ')
}

async function saveConsentRequest (conn, {
  consentId,
  consentRequestId,
  accountId,
  clientId,
  body
}) {
  const table = 'consent_requests'
  const columns = 'consent_request_id, consent_id, account_id, client_id, response'
  const sql = `INSERT INTO ${table}(${columns}) VALUES(${columnIndices(columns)})`
  const params = [
    consentRequestId,
    consentId,
    accountId,
    clientId,
    JSON.stringify(body)
  ]
  return conn.query(sql, params)
}

async function saveScope (conn, { scopeId, consentId, domain, area, description, purpose, lawfulBasis, permissions }) {
  const table = 'scope'
  const columns = 'scope_id, consent_id, domain, area, description, purpose, lawful_basis, read, write'
  const sql = `INSERT INTO ${table}(${columns}) VALUES(${columnIndices(columns)})`
  const params = [
    scopeId,
    consentId,
    domain,
    area,
    description,
    purpose,
    lawfulBasis,
    permissions.includes('READ'),
    permissions.includes('WRITE')
  ]
  return conn.query(sql, params)
}

async function saveEncryptionKey (conn, { consentEncryptionKeyId, consentEncryptionKey }) {
  const table = 'encryption_keys'
  const columns = 'key_id, encryption_key'
  const sql = `INSERT INTO ${table}(${columns}) VALUES(${columnIndices(columns)}) ON CONFLICT DO NOTHING`
  const params = [
    consentEncryptionKeyId, Buffer.from(consentEncryptionKey, 'base64').toString('utf8')
  ]
  return conn.query(sql, params)
}

async function saveScopeKeys (conn, consentEncryptionKeyId, scopes) {
  return Promise.all(scopes.map(async ({ scopeId }) => {
    const table = 'scope_keys'
    const columns = 'scope_id, encryption_key_id'
    const sql = `INSERT INTO ${table}(${columns}) VALUES(${columnIndices(columns)})`
    const params = [
      scopeId, consentEncryptionKeyId
    ]
    return conn.query(sql, params)
  }))
}

async function create (body) {
  await schemas.consent.validate(body, schemas.defaultOptions)

  const {
    consentRequestId,
    consentEncryptionKeyId,
    consentEncryptionKey,
    accountId,
    accountKey,
    clientId,
    scope
  } = body
  const consentId = v4()

  const conn = await connect()
  try {
    await conn.query('BEGIN')
    await saveConsentRequest(conn, { consentId, consentRequestId, accountId, clientId, body })
    const savedScopes = await Promise.all(scope.map(async (s) => {
      const scopeId = v4()
      s = {
        ...s,
        consentId,
        scopeId
      }
      await saveScope(conn, s)
      return s
    }))
    await saveEncryptionKey(conn, { consentEncryptionKeyId, consentEncryptionKey })
    await saveScopeKeys(conn, consentEncryptionKeyId, savedScopes)
    await conn.query('COMMIT')
  } finally {
    conn.end()
  }

  const accessToken = createToken({ consentId })

  const eventBody = {
    type: 'CONSENT_APPROVED',
    payload: {
      consentId,
      consentRequestId,
      consentEncryptionKeyId,
      accountKey,
      scope,
      accessToken
    }
  }

  try {
    await axios.post(`http://${clientId}/events`, eventBody)
  } catch (error) {
    throw new Error('could not post consent to client')
  }
}

async function get (id) {
  const conn = await connect()
  try {
    const result = await conn.query('SELECT * FROM consents WHERE id=$1', [id])

    if (!result || !result.rows || !result.rows.length) {
      throw new Error('No consent found')
    }

    return camelCase(result.rows[0])
  } finally {
    conn.end()
  }
}

module.exports = {
  createRequest,
  getRequest,
  create,
  get
}
