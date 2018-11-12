const jwt = require('jsonwebtoken')
const secret = 'sdfkjshkfjsdofdsj'

function createToken(account) {
  return jwt.sign({ account }, secret)
}

function verify(token) {
  return jwt.verify(token, secret)
}

module.exports = { createToken, verify }
