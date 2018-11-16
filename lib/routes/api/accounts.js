const { Router } = require('express')
const createError = require('http-errors')
const SSEStream = require('ssestream')
const { basename } = require('path')

const { create, get, del } = require('../../services/accounts')
const consentService = require('../../services/consents')
const { authorize } = require('../../middlewares/auth')
const pds = require('../../adapters/pds')

const router = Router()

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
router.get('/:accountId', authorize(), async ({ originalUrl, params: { accountId } }, res, next) => {
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
router.delete('/:accountId', authorize(), async ({ params: { accountId } }, res, next) => {
  try {
    await del(accountId)
    res.sendStatus(204)
  } catch (error) {
    next(error)
  }
})

// Fetch to consents
router.get('/:accountId/consents', authorize(), async (req, res, next) => {
  const consents = await consentService.getForAccount(req.params.accountId)

  res.status(200).send(consents.map(c => ({
    data: c,
    links: { self: `/consents/${encodeURIComponent(c.id)}` }
  })))
})

// Subscribe to stuff
router.get('/:accountId/events', authorize(), (req, res, next) => {
  try {
    const sseStream = new SSEStream(req)
    const consentListener = consentService.subscribe(req.params.accountId, (data) => {
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
    next(error)
  }
})

// Get your mydata
router.get('/:accountId/data/:area?', authorize(), async (req, res, next) => {
  const fs = pds.get(req.token.account)
  let areas
  if (req.params.area) {
    areas = [`${req.params.area}.json`]
  } else {
    areas = await fs.readdir('/data')
  }

  if (areas.length === 0) {
    return res.status(200).send({
      data: {},
      links: { self: req.originalUrl }
    })
  }

  const data = await Promise.all(areas.map(async area => ({ [basename(area, '.json')]: JSON.parse(await fs.readFile(`/data/${area}`, { encoding: 'utf8' })) })))

  if (!data) {
    return next(createError(404))
  }

  res.status(200).send({
    data: Object.assign(...data),
    links: { self: req.originalUrl }
  })
})

// Put your mydata
router.put('/:accountId/data/:area', authorize(), async ({ token, body: data, params }, res, next) => {
  const fs = pds.get(token.account)
  await fs.outputFile(`/data/${params.area}.json`, JSON.stringify(data), { encoding: 'utf8' })

  res.status(200).send({
    data,
    links: { self: encodeURIComponent(`/${params.accountId}/data/${params.area}`) }
  })
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
