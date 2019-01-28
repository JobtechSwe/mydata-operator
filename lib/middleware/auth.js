const createError = require('http-errors')
const { createVerify } = require('crypto')
const jwksClient = require('jwks-rsa')
const { promisify } = require('util')
const schemas = require('../services/schemas')

const clientsService = require('../services/clients')

// const { verify } = require('../services/jwt')

function authorize (req, res, next) {
  try {
    // TODO: Implement verification of signatures, from Clients and from App
    next()
  } catch (err) {
    if (err.code) {
      next(err)
    } else {
      next(createError(401))
    }
  }
}

const signed = ({ unsafe = false, accountKey = false, clientKey = false } = {}) => async (req, res, next) => {
  try {
    // Verify schema
    let schema
    if (accountKey) schema = schemas.signedPayloadWithAccountKey
    else if (clientKey) schema = schemas.signedPayloadWithClientKey
    else schema = schemas.signedPayloadWithKeyId

    await schema.validate(req.body, schemas.defaultOptions)

    const { data, signature } = req.body

    // Verify algorithm
    const validAlgorithms = ['RSA-SHA256', 'RSA-SHA512']
    if (!validAlgorithms.includes(signature.alg)) {
      throw createError(403, 'Invalid algorithm')
    }

    // Check unsafe
    if (data.unsafe && !unsafe) {
      throw createError(403, 'Unsafe host not allowed')
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
        const protocol = data.unsafe ? 'http' : 'https'
        const host = client ? client.clientId : data.clientId
        const jwksUrl = client ? client.jwksUrl : data.jwksUrl

        const jwksUri = `${protocol}://${host}${jwksUrl}`
        const { getSigningKey } = jwksClient({
          strictSsl: !data.unsafe,
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
        return next(createError(400, error))
      default:
        return next(error)
    }
  }
}

module.exports = {
  authorize,
  signed
}
