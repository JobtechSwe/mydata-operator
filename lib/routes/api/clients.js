const { Router } = require('express')
const Joi = require('joi')
const { create, get } = require('../../services/clients')
const createError = require('http-errors')

const router = Router()

const validationOptions = {
  abortEarly: false,
  convert: false
}

const schema = {
  displayName: Joi.string().required(),
  description: Joi.string().required().min(10),
  clientId: Joi.string().required(),
  jwksUrl: Joi.string().required()
}

// Register
router.post('/', async ({ body, publicKey = 'key-from-middlware' }, res, next) => {
  try {
    await Joi.validate(body.data, schema, validationOptions)

    await create(body.data, publicKey)
    const result = await get(body.data.clientId)

    res.send(result)
  } catch (error) {
    if (error.name === 'ValidationError') {
      next(createError(400, error))
    } else {
      next(error)
    }
  }
})

module.exports = router
