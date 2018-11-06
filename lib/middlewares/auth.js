const createError = require('http-errors')
const { verify } = require('../services/jwt')

function authorize() {
  return (req, res, next) => {
    try {
      const [, token] = req.headers['authorization'].split('Bearer ')
      req.token = verify(token)
      next()
    } catch (err) {
      next(createError(401))
    }
  }
}

module.exports = { authorize }
