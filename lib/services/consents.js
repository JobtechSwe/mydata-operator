const moment = require('moment')
const redis = require('../adapters/redis')
const { connect } = require('../adapters/postgres')
const { v4 } = require('uuid')
const axios = require('axios')
const { camelCase } = require('changecase-objects')
const schemas = require('./schemas')

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

const create = async (body) => {
  await schemas.consent.validate(body, schemas.defaultOptions)

  const { consentId, consentRequestId, accountId, publicKey, clientId, scope } = body

  const conn = await connect()
  try {
    await conn.query('INSERT INTO consents(id, account_id, client_id, scope) VALUES($1, $2, $3, $4)',
      [consentId, accountId, clientId, JSON.stringify(scope)])
  } finally {
    conn.end()
  }

  const eventBody = {
    type: 'CONSENT_APPROVED',
    payload: {
      consentId,
      consentRequestId,
      publicKey,
      scope
    }
  }

  try {
    await axios.post(`http://${clientId}/events`, eventBody)
  } catch (error) {
    throw new Error('could not post consent to client')
  }
}

const get = async id => {
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
