const { Router } = require('express')
const accounts = require('./accounts')
const auth = require('./auth')
const consents = require('./consents')

const router = Router()

router.use('/accounts', accounts)
router.use('/auth', auth)
router.use('/consents', consents)

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' })
})

module.exports = router
