const createError = require('http-errors')
const { login } = require('../services/accounts')
const { createToken } = require('../services/jwt')
const { Router } = require('express')
const router = Router()

// todo: make this less horribly insecure
router.post('/', async ({ body: { username, password, redirectURI, responseType } }, res, next) => {
  try {
    if (responseType !== 'token') {
      throw new Error('Unsupported response type')
    }
    const account = await login(username, password)
    const token = createToken({ account })
    res.redirect(`${redirectURI}?access_token=${token}`)
  } catch (err) {
    next(createError(401))
  }
})

module.exports = router
