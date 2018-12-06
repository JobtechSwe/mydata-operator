const { Router } = require('express')
const api = require('./api')
const accounts = require('./accounts')
const apps = require('./apps')

const router = Router()

router.use('/', accounts)
router.use('/apps', apps)
router.use('/api', api)

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' })
})

module.exports = router
