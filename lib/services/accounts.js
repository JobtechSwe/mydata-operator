const Joi = require('joi')
const { connect } = require('../adapters/postgres')
const { v4 } = require('uuid')
const { camelCase } = require('changecase-objects')

const validationOptions = {
  abortEarly: false,
  convert: false
}

function dbBufferToBase64 (dbCredentials) {
  const buffer = Buffer.from(Object.values(dbCredentials))
  return buffer.toString('base64')
}

async function create (account) {
  const schema = {
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    publicKey: Joi.string().required(),
    pds: {
      provider: Joi.string().required(),
      access_token: Joi.string().required()
    }
  }
  await Joi.validate(account, schema, validationOptions)

  const { publicKey, pds } = account
  const conn = await connect()
  try {
    const id = v4()
    const credentials = Buffer.from(JSON.stringify({ apiKey: pds.access_token }))
    // const scryptParams = await params(0.1)
    // const hashedPassword = await kdf(password, scryptParams)
    await conn.query('INSERT INTO accounts(id, public_key, pds_provider, pds_credentials) VALUES($1, $2, $3, $4)',
      [id, publicKey, pds.provider, credentials])
    return { id }
  } finally {
    conn.end()
  }
}

async function setPdsProvider (account, provider, credentials) {
  const conn = await connect()
  try {
    credentials = Buffer.from(JSON.stringify(credentials))
    await conn.query('UPDATE accounts SET pds_provider=$2, pds_credentials=$3 WHERE id=$1', [account.id, provider, credentials])

    return Object.assign({}, account, { pdsProvider: provider, pdsCredentials: credentials })
  } finally {
    conn.end()
  }
}

async function get (accountId) {
  await Joi.validate(accountId, Joi.string().required())
  const conn = await connect()
  try {
    const result = await conn.query('SELECT id, public_key, pds_provider, pds_credentials FROM accounts WHERE id=$1', [accountId])
    if (!result || !result.rows || !result.rows.length) {
      throw new Error('No account found')
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

module.exports = {
  create,
  get,
  setPdsProvider
}
