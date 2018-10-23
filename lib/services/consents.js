const Joi = require('joi')
const { createHash } = require('crypto')
const redis = require('../adapters/redis')

const tempConsentStore = {}
function storeConsent(consent) {
  console.log('storing consent', consent)
  if (!tempConsentStore[consent.account_id]) {
    tempConsentStore[consent.account_id] = {}
  }
  tempConsentStore[consent.account_id][consent.id] = consent
}

function getConsent(consentId) {
  // TODO: This is very terrible
  let result = undefined
  Object.keys(tempConsentStore).forEach(key => {
    foo = tempConsentStore[key][consentId]
    if (foo) {
      result = foo
    }
  })
  return result
}

function getConsentsForAccount(accountId) {
  return Object.values(tempConsentStore[accountId] || {})
}

function log(...args) {
  args
    .map(a => JSON.stringify(a))
    .forEach(t => process.stdout.write(t + ' '))
  process.stdout.write('\n')
}

const validationOptions = {
  abortEarly: false,
  convert: false
}

function createId({ account_id, client_id }) {
  const hash = createHash('SHA256')
  hash.update(JSON.stringify({ account_id, client_id }))
  return hash.digest().toString('base64')
}

async function request(consentRequest) {
  const schema = {
    account_id: Joi.string().required(),
    client_id: Joi.string().required(),
    scope: Joi.array().items(Joi.string()).min(1),
    description: Joi.string().required()
  }
  await Joi.validate(consentRequest, schema, validationOptions)
  consentRequest = Object.assign({}, consentRequest, { id: createId(consentRequest), status: 'pending' })
  const data = JSON.stringify(consentRequest)
  await redis.set(`consent:${consentRequest.id}`, data)
  await redis.publish(`consents:${consentRequest.account_id}`, data)
  storeConsent(consentRequest)

  return consentRequest
}

async function get(consentId) {
  await Joi.validate(consentId, Joi.string().required())
  return getConsent(consentId)
  /* return redis.getJson(`consent:${consentId}` */
}

async function getForAccount(accountId) {
  return getConsentsForAccount(accountId)
}

async function update(consent) {
  storeConsent(consent)
  await redis.publish(`consents:${consent.account_id}`, JSON.stringify(consent))
}

function subscribe(accountId, listener) {
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
  update,
  request,
  subscribe
}
