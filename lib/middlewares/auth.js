const createError = require('http-errors')
// const { verify } = require('../services/jwt')

function authorize (req, res, next) {
  try {
    // TODO: Implement verification of signatures, from Clients and from App
    next()
  } catch (err) {
    if (err.code) {
      next(err)
    } else {
      next(createError(401))
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
