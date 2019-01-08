const { Router } = require('express')
const createError = require('http-errors')
const consentService = require('./../../services/consents')
const accountService = require('./../../services/accounts')
const pds = require('./../../adapters/pds')
const { basename } = require('path')

const router = Router()

router.get('/', async (req, res, next) => {

  if (!req.query.consentId) {
    console.warn('req.query.consentId', req.query.consentId)
    return next(createError(400))
  }

  try {
    const { accountId } = await consentService.get(req.query.consentId)

    const account = await accountService.get(accountId)

    console.warn('account', account)

    // const fs = pds.get(account)
    // let areas
    // if (req.params.area) {
    //   areas = [`${req.params.area}.json`]
    // } else {
    //   areas = await fs.readdir('/data')
    // }

    // if (areas.length === 0) {
    //   return res.status(200).send({
    //     data: {},
    //     links: { self: req.originalUrl }
    //   })
    // }

    // const data = await Promise.all(areas.map(async area => ({ [basename(area, '.json')]: JSON.parse(await fs.readFile(`/data/${area}`, { encoding: 'utf8' })) })))
  } catch (error) {
    console.warn('could not get consent or account from db', error)
    return next(createError(500))
  }

  res.send({
    baseData: {
      firstName: 'test',
      lastName: 'test',
      headline: 'this is a reallytest very seriously'
    }
  })
})

module.exports = router
