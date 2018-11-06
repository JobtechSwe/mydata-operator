const { Router } = require('express')
const accounts = require('./accounts')
const auth = require('./auth')
const consents = require('./consents')
const register = require('./register')
const login = require('./login')

const router = Router()

router.use('/accounts', accounts)
router.use('/auth', auth)
router.use('/consents', consents)
router.use('/register', register)
router.use('/login', login)

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' })
})

module.exports = router
