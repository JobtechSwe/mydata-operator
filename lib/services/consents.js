const Joi = require('joi')
const moment = require('moment')
const redis = require('../adapters/redis')
const { connect } = require('../adapters/postgres')
const { v4 } = require('uuid')
const axios = require('axios')
const { camelCase } = require('changecase-objects')

const validationOptions = {
  abortEarly: false,
  convert: false
}

async function createRequest (data, signature) {
  const schema = Joi.object({
    clientId: Joi.string().required(),
    kid: Joi.string().required(),
    scope: Joi.array().items(Joi.object({
      domain: Joi.string().required(),
      area: Joi.string().required(),
      description: Joi.string().required(),
      permissions: Joi.array().items(
        Joi.string().required()
      ).required().min(1),
      purpose: Joi.string().required(),
      lawfulBasis: Joi.string().required(),
      required: Joi.bool().allow()
    })).required().min(1),
    expiry: Joi.number().required()
  }).required()

  await Joi.validate(data, schema, validationOptions)

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
  const scopeEntrySchema = {
    domain: Joi.string().uri().required(),
    area: Joi.string().required(),
    clientEncryptionDocumentKey: Joi.string().base64().required()
  }

  const schema = {
    consentId: Joi.string().guid().required(),
    consentEncryptionKey: Joi.string().base64().required(),
    accountId: Joi.string().guid().required(),
    accountKey: Joi.string().base64().required(),
    scope: Joi.array().items(scopeEntrySchema).min(1).required()
  }
  await Joi.validate(body, schema, validationOptions)

  const { consentId, accountId, accountKey, scope } = body

  const { clientId } = JSON.parse(await redis.get(`consentRequest:${consentId}`))

  const conn = await connect()
  try {
    await conn.query('INSERT INTO consents(id, account_id, clientId, scope) VALUES($1, $2, $3, $4)',
      [consentId, accountId, clientId, JSON.stringify(scope)])
  } finally {
    conn.end()
  }

  const eventBody = {
    type: 'CONSENT_APPROVED',
    payload: {
      consentId,
      accountKey,
      scope
    }
  }

  try {
    await axios.post(`${clientId}/events`, eventBody)
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
