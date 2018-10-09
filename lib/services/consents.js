const Joi = require('joi')

const options = {
  abortEarly: false,
  convert: false
}

async function request(consentRequest) {
  const schema = {
    client_id: Joi.string().required(),
    scope: Joi.array().items(Joi.string()).min(1),
    description: Joi.string().required()
  }
  await Joi.validate(consentRequest, schema, options)

  return { id: 'abc' }
}

async function get(consentId) {
  await Joi.validate(consentId, Joi.string().required())

}

module.exports = {
  get,
  request
}
