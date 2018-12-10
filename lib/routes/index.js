const { Router } = require('express')
const api = require('./api')
const accounts = require('./accounts')
const clients = require('./clients')

const router = Router()

router.use('/', accounts)
router.use('/clients', clients)
router.use('/api', api)

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' })
})

module.exports = router
