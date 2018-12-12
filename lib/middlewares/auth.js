const createError = require('http-errors')
const { verify } = require('../services/jwt')

function authorize () {
  return (req, res, next) => {
    try {
      const [, token] = req.headers['authorization'].split('Bearer ')
      req.token = verify(token)
      if (req.token.account.id !== req.params.accountId) {
        next(createError(403))
      }
      next()
    } catch (err) {
      if (err.code) {
        next(err)
      } else {
        next(createError(401))
      }
    }
  }
}

function requireSession ({ session }, res, next) {
  if (session && session.account) {
    next()
  } else {
    res.redirect('/login')
  }
}

module.exports = {
  authorize,
  requireSession
}
