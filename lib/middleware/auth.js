const createError = require('http-errors')
const Joi = require('joi')
const { createVerify } = require('crypto')
const jwksClient = require('jwks-rsa')
const { promisify } = require('util')

const clientsService = require('../services/clients')

const validationOptions = {
  abortEarly: false,
  convert: false
}

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

const signed = ({ unsafe = false, withKey = false } = {}) => async (req, res, next) => {
  try {
    // Verify schema
    const schema = withKey ? {
      data: Joi.object({
        publicKey: Joi.string().required()
      }).required().unknown(true),
      signature: Joi.object({
        data: Joi.string().required()
      }).required()
    } : {
      data: Joi.object({
        clientId: Joi.string().required()
      }).required().unknown(true),
      signature: Joi.object({
        data: Joi.string().required(),
        kid: Joi.string().required()
      }).required()
    }
    await Joi.validate(req.body, schema, validationOptions)

    const { data, signature } = req.body

    // Check unsafe
    if (data.unsafe && !unsafe) {
      throw createError(403, 'Unsafe host not allowed')
    }

    // Load client
    let client
    if (!withKey) {
      client = await clientsService.get(data.clientId)
      if (!client) {
        if (signature.kid !== 'client_key' || !data.jwksUrl) {
          throw createError(401, 'Unknown clientId')
        }
      }
    }

    let verifyKey
    if (withKey) {
      verifyKey = data.publicKey
    } else if (client && signature.kid === 'client_key') {
      verifyKey = client.publicKey
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
    if (!createVerify('SHA256')
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