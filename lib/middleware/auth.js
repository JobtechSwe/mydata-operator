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

function requireSession ({ session }, res, next) {
  if (session && session.account) {
    next()
  } else {
    res.redirect('/login')
  }
}

const signed = ({ unsafe = false } = {}) => async (req, res, next) => {
  try {
    // Verify schema
    const schema = {
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

    // Load client
    const client = await clientsService.get(data.clientId)
    if (!client) {
      throw createError(401, 'Unknown clientId')
    }

    let verifyKey
    if (signature.kid === 'client_key') {
      verifyKey = client.publicKey
    } else {
      try {
        const jwksUri = `${unsafe ? 'http' : 'https'}://${client.clientId}${client.jwksUrl}`
        const { getSigningKey } = jwksClient({
          strictSsl: !unsafe,
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
  requireSession,
  signed
}
