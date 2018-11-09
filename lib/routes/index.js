const { Router } = require('express')
const accounts = require('./accounts')
const consents = require('./consents')
const user = require('./user')

const router = Router()

router.use('/', user)
router.use('/accounts', accounts)
router.use('/consents', consents)

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' })
})

module.exports = router
