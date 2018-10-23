const { Router } = require('express')
const createError = require('http-errors')
const consentsService = require('../services/consents')

const router = Router()

router.post('/', async ({ originalUrl, body: consentRequest }, res, next) => {
  try {
    const consent = await consentsService.request(consentRequest)
    res.status(201).send({
      data: consent,
      links: {
        self: `${originalUrl}/${encodeURIComponent(consent.id)}`
      }
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      next(createError(400, error))
    } else {
      next(error)
    }
  }
})
router.get('/:id', async ({ originalUrl, params: { id } }, res, next) => {
  try {
    const consent = await consentsService.get(id)
    if (!consent) {
      return next(createError(404))
    }
    res.status(200).send({
      data: consent,
      links: { self: originalUrl }
    })
  } catch (error) {
    res.status(500)
    next(error)
  }
})

router.put('/:id', async ({ originalUrl, body: consent }, res, next) => {
  try {
    await consentsService.update(consent)

    res.status(204).send()
  } catch (error) {
    res.status(500)
    next(error)
  }
})

module.exports = router
