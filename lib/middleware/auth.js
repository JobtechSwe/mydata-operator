const createError = require('http-errors')
const { createVerify } = require('crypto')
const jwksClient = require('jwks-rsa')
const { promisify } = require('util')
const schemas = require('../services/schemas')

const clientsService = require('../services/clients')

const signed = ({ accountKey = false, clientKey = false } = {}) => async (req, res, next) => {
  try {
    // Verify schema
    let schema
    if (accountKey) {
      schema = schemas.signedPayloadWithAccountKey
    } else if (clientKey) {
      schema = schemas.signedPayloadWithClientKey
    } else {
      schema = schemas.signedPayloadWithKeyId()
    }
    await schema.validate(req.body, schemas.defaultOptions)

    const { data, signature } = req.body

    // Verify algorithm
    const validAlgorithms = ['RSA-SHA256', 'RSA-SHA512']
    if (!validAlgorithms.includes(signature.alg)) {
      throw createError(403, 'Invalid algorithm')
    }

    // Load client
    let client
    if (data.clientId && !clientKey) {
      client = await clientsService.get(data.clientId)
      if (!client) {
        if (signature.kid !== 'client_key' || !data.jwksUrl) {
          throw createError(401, 'Unknown clientId')
        }
      }
    }

    let verifyKey
    if (accountKey) {
      verifyKey = Buffer.from(data.accountKey, 'base64').toString('utf8')
    } else if (clientKey) {
      verifyKey = Buffer.from(data.clientKey, 'base64').toString('utf8')
    } else if (client && signature.kid === 'client_key') {
      verifyKey = client.clientKey
    } else {
      try {
        const jwksUri = client
          ? client.clientId + client.jwksUrl
          : data.clientId + data.jwksUrl

        const { getSigningKey } = jwksClient({
          strictSsl: !schemas.isUnsafe(),
          jwksUri
        })
        const { publicKey, rsaPublicKey } = await promisify(getSigningKey)(signature.kid)
        verifyKey = publicKey || rsaPublicKey
      } catch (err) {
        throw createError(401, 'Could not retrieve key')
      }
    }

    // Verify signature
    if (!verifyKey) {
      throw createError(400, 'Cannot find signature key')
    }
    if (!createVerify(signature.alg)
      .update(JSON.stringify(data))
      .verify(verifyKey, signature.data, 'base64')) {
      throw createError(403, 'Invalid signature')
    }

    req.body = req.body.data
    req.signature = {
      ...signature,
      client,
      key: verifyKey
    }
    next()
  } catch (error) {
    switch (error.name) {
      case 'ValidationError':
        const errorToReturn = error.message.includes('"clientId" must be a valid uri with a scheme matching the https pattern')
          ? createError(403, 'Unsafe (http) is not allowed')
          : createError(400, error)
        return next(errorToReturn)
      default:
        return next(error)
    }
  }
}

module.exports = {
  signed
}
