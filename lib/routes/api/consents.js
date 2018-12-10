const { Router } = require('express')
const createError = require('http-errors')
const consentService = require('../../services/consents')

const router = Router()

router.post('/requests', async ({ body }, res, next) => {
  try {
    const consentRequestId = await consentService.createRequest(body)
    res.status(201).send({
      consentRequestId
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      next(createError(400, error))
    } else {
      next(error)
    }
  }
})

router.get('/requests/:id', async ({ body, params }, res, next) => {
  try {
    const data = await consentService.getRequest(params.id)

    if (!data) {
      return res.sendStatus(404)
    }

    res.send({
      data
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      next(createError(400, error))
    } else {
      next(error)
    }
  }
})

module.exports = router
