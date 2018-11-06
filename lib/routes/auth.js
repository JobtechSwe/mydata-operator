const createError = require('http-errors')
const { login } = require('../services/accounts')
const { createToken } = require('../services/jwt')
const { Router } = require('express')
const router = Router()

router.post('/', async ({ body: { username, password } }, res, next) => {
  try {
    const account = await login(username, password)
    const token = createToken({ account })
    res.send({ token })
  } catch (err) {
    next(createError(401))
  }
})

module.exports = router
