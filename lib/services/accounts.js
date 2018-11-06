const Joi = require('joi')
const redis = require('../adapters/redis')
const { connect } = require('../adapters/postgres')
const { v4 } = require('uuid')
const { params, kdf, verifyKdf } = require('scrypt')

const validationOptions = {
  abortEarly: false,
  convert: false
}

async function create({ username, password }) {
  const schema = {
    username: Joi.string().required(),
    password: Joi.string().required().min(10)
  }
  await Joi.validate({ username, password }, schema, validationOptions)
  const conn = await connect()
  try {
    const id = v4()
    const scryptParams = await params(0.1)
    const hashedPassword = await kdf(password, scryptParams)
    await conn.query('INSERT INTO accounts(id, username, password) VALUES($1, $2, $3)', [id, username, hashedPassword])
    return { id, username }
  } finally {
    conn.end()
  }
}

async function login(username, password) {
  const schema = {
    username: Joi.string().required(),
    password: Joi.string().required()
  }
  await Joi.validate({ username, password }, schema, validationOptions)
  const conn = await connect()
  let account
  try {
    [account] = conn.query('SELECT * FROM accounts WHERE username=$1', [username])
    if (!account) {
      throw new Error('Wrong credentials')
    }
  } finally {
    conn.end()
  }
  if (!await verifyKdf(account.password, pasword)) {
    throw new Error('Wrong credentials')
  }
  delete account.password
  return account
}

async function get(accountId) {
  await Joi.validate(accountId, Joi.string().required())
  return redis.getJson(`account:${accountId}`)
}

async function del(accountId) {
  await Joi.validate(accountId, Joi.string().required())
  return redis.del(`account:${accountId}`)
}

async function attachDevice() {

}

async function detachDevice() {

}

module.exports = {
  create,
  get,
  del,
  attachDevice,
  detachDevice
}
