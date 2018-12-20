const Joi = require('joi')
const moment = require('moment')
const redis = require('../adapters/redis')
const { connect } = require('../adapters/postgres')
const { v4 } = require('uuid')
const axios = require('axios')
const clientsService = require('./clients')
const { camelCase } = require('changecase-objects')

const validationOptions = {
  abortEarly: false,
  convert: false
}

async function createRequest (body) {
  const schema = {
    clientId: Joi.string().required(),
    scope: Joi.array().items(Joi.string()).min(1)
  }

  await Joi.validate(body, schema, validationOptions)

  let id, result, expires
  let tries = 0
  do {
    id = v4()
    const data = JSON.stringify({ ...body, id })
    const expireInSeconds = 3600
    result = await redis.set(`consentRequest:${id}`, data, 'NX', 'EX', expireInSeconds)
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
  const request = JSON.parse(await redis.get(`consentRequest:${id}`))
  const client = await clientsService.get(request.clientId)
  return { request, client }
}

const create = async (body) => {
  const schema = {
    id: Joi.string().guid().required(),
    clientId: Joi.string().required(),
    accountId: Joi.string().guid().required(),
    scope: Joi.array().items(Joi.string()).min(1).required()
  }
  await Joi.validate(body, schema, validationOptions)
  const { id, clientId, scope, accountId } = body

  const conn = await connect()
  try {
    await conn.query('INSERT INTO consents(id, account_id, clientId, scope) VALUES($1, $2, $3, $4)',
      [id, accountId, clientId, JSON.stringify(scope)])
  } finally {
    conn.end()
  }

  const eventBody = {
    type: 'CONSENT_APPROVED',
    payload: {
      id,
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
