const Joi = require('joi')
const { createHash } = require('crypto')
const redis = require('../adapters/redis')

const validationOptions = {
  abortEarly: false,
  convert: false
}

async function create(account) {
  const schema = {
    id: Joi.string().required()
  }
  await Joi.validate(account, schema, validationOptions)
  await redis.setJson(`account:${account.id}`, account)
  return account
}

async function get(accountId) {
  await Joi.validate(accountId, Joi.string().required())
  return redis.getJson(`account:${accountId}`)
}

async function attachDevice() {

}

async function detachDevice() {

}

module.exports = {
  create,
  get,
  attachDevice,
  detachDevice
}
