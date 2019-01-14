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
  const schema = Joi.object({
    publicKey: Joi.string().required(),
    pds: Joi.object({
      provider: Joi.string().required(),
      access_token: Joi.string().required()
    }).required().unknown(true)
  }).required().unknown(true)
  await Joi.validate(account, schema, validationOptions)

  const { publicKey, pds } = account
  const conn = await connect()
  try {
    const id = v4()
    const credentials = Buffer.from(JSON.stringify({ apiKey: pds.access_token }))
    await conn.query('INSERT INTO accounts(id, public_key, pds_provider, pds_credentials) VALUES($1, $2, $3, $4)', [
      id,
      Buffer.from(publicKey, 'base64').toString('utf8'),
      pds.provider,
      credentials
    ])
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
    if (!result.rows.length) {
      return
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
