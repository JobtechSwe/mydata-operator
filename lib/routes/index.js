const { Router } = require('express')
const consents = require('./consents')

const router = Router()

router.use('/consents', consents)

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' })
})

module.exports = router;
