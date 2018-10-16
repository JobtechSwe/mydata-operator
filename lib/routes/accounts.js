const { Router } = require('express')
const router = Router()
const createError = require('http-errors')
const SSEStream = require('ssestream')

const { create, get } = require('../services/accounts')
const { subscribe } = require('../services/consents')

// Create account
router.post('/', async ({ originalUrl, body: account }, res, next) => {
  try {
    const result = await create(account)
    res.status(201).send({
      data: result,
      links: {
        self: `${originalUrl}/${encodeURIComponent(result.id)}`
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

// Get account
router.get('/:accountId', async ({ originalUrl, params: { accountId } }, res, next) => {
  try {
    const account = await get(accountId)
    if (!account) {
      return next(createError(404))
    }
    res.send({
      data: account,
      links: {
        self: originalUrl
      }
    })
  } catch (error) {
    next(error)
  }
})

// Subscribe to consents
router.get('/:accountId/consents', (req, res, next) => {
  try {
    const stream = new SSEStream(req)
    stream.pipe(res)
    res.on('close', () => {
      console.log('closed')
      // stream.unpipe(res)
      // stop subscribing
    })

    const emitter = subscribe(req.params.accountId)
    emitter.on('consent', (consent) => {
      console.log('consent', consent)
      stream.write({
        event: 'consent',
        data: consent
      })
    })
  } catch (error) {
    next(error)
  }
})

// Get attached devices
router.get('/:accountId/devices', (req, res, next) => {
  res.send()
})

// Attach device
router.post('/:accountId/devices', (req, res, next) => {
  res.send()
})

// Get attached device
router.get('/:accountId/devices/:deviceId', (req, res, next) => {
  res.send()
})

// Detach device
router.delete('/:accountId/devices/:deviceId', (req, res, next) => {
  res.send()
})

module.exports = router
