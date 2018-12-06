const { Router } = require('express')
const { create } = require('./../services/apps')

const router = Router()

// Register
router.get('/register', (req, res, next) => {
  res.render('apps/register', {})
})

router.post('/register', async ({ body }, res, next) => {
  try {
    await create(body)

    res.redirect('/apps/done')
  } catch (err) {
    next(err)
  }
})

// Done
router.get('/done', (req, res, next) => {
  res.render('apps/done', {})
})

module.exports = router
