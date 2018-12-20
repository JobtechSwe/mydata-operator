const { Router } = require('express')
const Joi = require('joi')
const { create } = require('../../services/clients')
const createError = require('http-errors')
const { signed } = require('../../middleware/auth')

const router = Router()

const validationOptions = {
  abortEarly: false,
  convert: false
}

const schema = {
  displayName: Joi.string().required(),
  description: Joi.string().required().min(10),
  clientId: Joi.string().required(),
  jwksUrl: Joi.string().required(),
  eventsUrl: Joi.string().required()
}

// Register
router.post('/', signed({ unsafe: true, withKey: true }), async ({ body }, res, next) => {
  try {
    await Joi.validate(body, schema, validationOptions)
    const result = await create(body)

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
