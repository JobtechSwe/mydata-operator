const jwt = require('jsonwebtoken')
const secret = 'sdfkjshkfjsdofdsj'

function createToken({ id, username, pdsProvider}) {
  return jwt.sign({ account: { id, username, pdsProvider }}, secret)
}

function verify(token) {
  return jwt.verify(token, secret)
}

module.exports = { createToken, verify }
