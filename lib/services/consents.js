const Joi = require('joi')
const { createHash } = require('crypto')
const redis = require('../adapters/redis')

const tempConsentStore = {}
function storeConsent (consent) {
  if (!tempConsentStore[consent.account_id]) {
    tempConsentStore[consent.account_id] = {}
  }
  tempConsentStore[consent.account_id][consent.id] = consent
}

function getConsent (consentId) {
  // TODO: This is very terrible
  let result
  Object.keys(tempConsentStore).forEach(key => {
    const foo = tempConsentStore[key][consentId]
    if (foo) {
      result = foo
    }
  })
  return result
}

function getConsentsForAccount (accountId) {
  return Object.values(tempConsentStore[accountId] || {})
}

const validationOptions = {
  abortEarly: false,
  convert: false
}

const createId = () => Array.from([0, 0, 0, 0])
  .map(() => Math.floor(Math.random() * 10))
  .join('')

async function createRequest (body) {
  const schema = {
    client_id: Joi.string().required(),
    scope: Joi.array().items(Joi.string()).min(1)
  }

  await Joi.validate(body, schema, validationOptions)
  const data = JSON.stringify(body)
  const expireInSeconds = 3600

  let result, id
  let tries = 0
  do {
    id = createId()
    result = await redis.set(`consentRequest:${id}`, data, 'NX', 'EX', expireInSeconds)

    if (tries++ > 10) {
      throw Error('max tries when setting consentRequest in redis')
    }
  } while (result !== 'OK')

  return id
}

const getRequest = id => redis
  .get(`consentRequest:${id}`)
  .then(val => JSON.parse(val))

async function get (consentId) {
  await Joi.validate(consentId, Joi.string().required())
  return getConsent(consentId)
  /* return redis.getJson(`consent:${consentId}` */
}

async function getForAccount (accountId) {
  return getConsentsForAccount(accountId)
}

function subscribe (accountId, listener) {
  const channelName = `consents:${accountId}`
  redis.subscribe(channelName)
  redis.on('message', (channel, message) => {
    if (channel === channelName) {
      listener(message)
    }
  })
  return { unsubscribe: () => redis.unsubscribe(channelName) }
}

module.exports = {
  get,
  getForAccount,
  createRequest,
  getRequest,
  subscribe
}
