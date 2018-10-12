const Joi = require('joi')
const { createHash } = require('crypto')
const redis = require('../adapters/redis')

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
  consentRequest = Object.assign({}, consentRequest, { id: createId(consentRequest) })
  await redis.setJson(consentRequest.id, consentRequest)

  return consentRequest
}

async function get(consentId) {
  await Joi.validate(consentId, Joi.string().required())
  return redis.getJson(consentId)
}

module.exports = {
  get,
  request
}
