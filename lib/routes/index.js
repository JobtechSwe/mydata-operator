const { Router } = require('express')
const api = require('./api')
const accounts = require('./accounts')

const router = Router()

router.use('/', accounts)
router.use('/api', api)

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' })
})

module.exports = router
