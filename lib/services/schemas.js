const Joi = require('joi')

/**
 * Options
 */
const defaultOptions = {
  abortEarly: false,
  convert: false
}

/**
 * Schemas
 */

// Accounts
const accountId = Joi.string().uuid().required()

const createAccount = Joi.object({
  publicKey: Joi.string().required(),
  pds: Joi.object({
    provider: Joi.string().required(),
    access_token: Joi.string().required()
  }).required().unknown(true)
}).required().unknown(true)

// Clients
const registerClient = Joi.object({
  displayName: Joi.string().required(),
  description: Joi.string().required().min(10),
  clientId: Joi.string().required(),
  jwksUrl: Joi.string().required(),
  eventsUrl: Joi.string().required(),
  unsafe: Joi.bool().optional()
}).required()

// Consent
const consentRequest = Joi.object({
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

const scopeEntry = Joi.object({
  domain: Joi.string().uri().required(),
  area: Joi.string().required(),
  clientEncryptionDocumentKey: Joi.string().base64().optional()
}).unknown(true)

const consent = Joi.object({
  consentRequestId: Joi.string().guid().required(),
  consentEncryptionKey: Joi.string().base64().required(),
  accountId: Joi.string().guid().required(),
  publicKey: Joi.string().base64().required(),
  clientId: Joi.string().required(),
  scope: Joi.array().items(scopeEntry).min(1).required()
}).required()

// Signatures
const signedPayloadWithKey = Joi.object({
  data: Joi.object({
    publicKey: Joi.string().required()
  }).required().unknown(true),
  signature: Joi.object({
    alg: Joi.string().required(),
    data: Joi.string().required()
  }).required()
}).required()
const signedPayloadWithKeyId = Joi.object({
  data: Joi.object({
    clientId: Joi.string().required()
  }).required().unknown(true),
  signature: Joi.object({
    alg: Joi.string().required(),
    data: Joi.string().required(),
    kid: Joi.string().required()
  }).required()
}).required()

module.exports = {
  defaultOptions,

  accountId,
  createAccount,

  registerClient,

  consentRequest,
  consent,

  signedPayloadWithKey,
  signedPayloadWithKeyId
}
