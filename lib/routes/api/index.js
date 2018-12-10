const { Router } = require('express')
const accounts = require('./accounts')
const consents = require('./consents')
const clients = require('./clients')

const router = Router()
router.use('/accounts', accounts)
router.use('/consents', consents)
router.use('/consentRequests', consents)
router.use('/clients', clients)

/* GET home page. */
router.get('/', (req, res, next) => {
  res.send({})
})

module.exports = router
