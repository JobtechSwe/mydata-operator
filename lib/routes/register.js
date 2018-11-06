const { Router } = require('express')

const router = Router()

router.get('/', (req, res, next) => {
  res.render('register', { endpoint: '/accounts', operatorName: 'Smooth Operator' })
})

module.exports = router
