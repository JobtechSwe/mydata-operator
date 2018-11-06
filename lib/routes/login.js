const { Router } = require('express')

const router = Router()

router.get('/', (req, res, next) => {
  res.render('login', {
    endpoint: '/auth',
    operatorName: 'Smooth Operator',
    redirectURI: req.query.redirect_uri,
    serviceName: req.query.serviceName,
    responseType: req.query.response_type,
  })
})

module.exports = router
