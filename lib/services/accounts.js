const Joi = require('joi')
const redis = require('../adapters/redis')
const { connect } = require('../adapters/postgres')
const { v4 } = require('uuid')
const { params, kdf, verifyKdf } = require('scrypt')
const { camelCase } = require('changecase-objects')

const validationOptions = {
  abortEarly: false,
  convert: false
}

function dbBufferToBase64 (dbCredentials) {
  const buffer = Buffer.from(Object.values(dbCredentials))
  return buffer.toString('base64')
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
    const result = await conn.query('SELECT * FROM accounts WHERE username=$1', [username])
    if (!result && !result.rows && !result.rows.length) {
      throw new Error('Wrong credentials')
    }
    account = camelCase(result.rows[0])
  } finally {
    conn.end()
  }
  const kdf = Buffer.from(Object.values(account.password))
  if (!await verifyKdf(kdf, password)) {
    throw new Error('Wrong credentials')
  }
  if (account.pdsCredentials) {
    account.pdsCredentials = dbBufferToBase64(account.pdsCredentials)
  }
  delete account.password
  return account
}

async function setPdsProvider(account, provider, credentials) {
  const conn = await connect()
  try {
    credentials = Buffer.from(JSON.stringify(credentials))
    const result = await conn.query('UPDATE accounts SET pds_provider=$2, pds_credentials=$3 WHERE id=$1', [account.id, provider, credentials])

    return Object.assign({}, account, { pdsProvider: provider, pdsCredentials: credentials })
  } finally {
    conn.end()
  }
}

async function get(accountId) {
  await Joi.validate(accountId, Joi.string().required())
  const conn = await connect()
  try {
    const result = await conn.query('SELECT id, username, pds_provider, pds_credentials FROM accounts WHERE id=$1', [accountId])
    if (!result || !result.rows || !result.rows.length) {
      throw new createError(401)
    }
    const account = camelCase(result.rows[0])
    if (account.pdsCredentials) {
      account.pdsCredentials = dbBufferToBase64(account.pdsCredentials)
    }
    return account
  } finally {
    conn.end()
  }
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
  login,
  get,
  del,
  attachDevice,
  detachDevice,
  setPdsProvider
}
