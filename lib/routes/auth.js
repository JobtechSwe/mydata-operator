const { login } = require('../services/accounts')
const { createToken } = require('../services/jwt')
const { Router } = require('express')
const router = Router()

router.post('/', async ({ body: { username, password } }, res, next) => {
  try {
    const user = await login(username, password)
    const token = createToken(user)
    res.send(token)
  } catch (err) {
    console.warn(err)
    next(err)
  }
})

module.exports = router
