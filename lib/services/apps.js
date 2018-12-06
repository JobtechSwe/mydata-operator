const Joi = require('joi')
const { connect } = require('../adapters/postgres')
const { v4 } = require('uuid')

const validationOptions = {
  abortEarly: false,
  convert: false
}

async function create ({ name, description, clientId, jwksUrl }) {
  const schema = {
    name: Joi.string().required(),
    description: Joi.string().required().min(10),
    clientId: Joi.string().required(),
    jwksUrl: Joi.string().required()
  }

  await Joi.validate({ name, description, clientId, jwksUrl }, schema, validationOptions)

  const conn = await connect()
  try {
    const id = v4()
    await conn.query('INSERT INTO apps(id, name, description, client_id, jwks_url) VALUES($1, $2, $3, $4, $5)', [id, name, description, clientId, jwksUrl])
    return { name }
  } finally {
    conn.end()
  }
}

module.exports = {
  create
}
