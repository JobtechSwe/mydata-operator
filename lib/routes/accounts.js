const { Router } = require('express')
const createError = require('http-errors')
const SSEStream = require('ssestream')

const { create, get, del } = require('../services/accounts')
const { subscribe, getForAccount } = require('../services/consents')

const router = Router()

function log(...args) {
  args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).forEach(t => process.stdout.write(t + ' '))
  process.stdout.write('\n')
}

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

// Delete account
router.delete('/:accountId', async ({ originalUrl, params: { accountId } }, res, next) => {
  try {
    const account = await del(accountId)
    res.send(204)
  } catch (error) {
    next(error)
  }
})

// Fetch to consents
router.get('/:accountId/consents', async (req, res, next) => {
  const consents = await getForAccount(req.params.accountId)

  res.status(200).send(consents.map(c => ({
    data: c,
    links: { self: `/consents/${c.id}` }
  })))
})
// Subscribe to stuff
router.get('/:accountId/events', (req, res, next) => {
  try {
    const sseStream = new SSEStream(req)
    const consentListener = subscribe(req.params.accountId, (data) => {
      sseStream.write({
        event: 'consent',
        data
      })
    })

    sseStream.pipe(res)
    res.on('close', () => {
      sseStream.unpipe(res)
      consentListener.unsubscribe()
    })
  } catch (error) {
    log('error', error.message, error.stack)
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
