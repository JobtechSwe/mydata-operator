const { promisify } = require('util')
const createError = require('http-errors')
const { login } = require('../services/accounts')
const { createToken } = require('../services/jwt')
const { Router } = require('express')
const router = Router()

router.post('/', async ({ body: { username, password }, session }, res, next) => {
  try {
    const account = await login(username, password)
    session.account = account
    const token = createToken({ account })
    res.send({ token })
  } catch (err) {
    next(createError(401))
  }
})

router.get('/logout', async ({ session }, res, next) => {
  await promisify(session.destroy.bind(session))()
  res.send(204)
})

module.exports = router
