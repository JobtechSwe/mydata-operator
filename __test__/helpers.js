const request = require('supertest')
const { generateKeyPair, createSign } = require('crypto')
const { promisify } = require('util')

const createApi = (app) => {
  const api = request(app)
  return {
    get: (url) => api
      .get(url)
      .set({ Accept: 'application/json' }),
    post: (url, data) => api.post(url)
      .set({ 'Content-Type': 'application/json' })
      .accept('application/json')
      .send(data),
    put: (url, data) => api.put(url)
      .set({ 'Content-Type': 'application/json' })
      .accept('application/json')
      .send(data),
    patch: (url, data) => api.patch(url)
      .set({ 'Content-Type': 'application/json' })
      .accept('application/json')
      .send(data),
    del: (url) => api
      .del(url)
      .set({ Accept: 'application/json' }),
    delete: (url) => api
      .delete(url)
      .set({ Accept: 'application/json' })
  }
}

const generateKeys = async (use, kid) => {
  const { publicKey, privateKey } = await promisify(generateKeyPair)('rsa', {
    modulusLength: 1024,
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
  })
  return { use, kid, publicKey, privateKey }
}

const sign = (alg, data, privateKey) => {
  return createSign(alg)
    .update(JSON.stringify(data))
    .sign(privateKey, 'base64')
}

module.exports = { createApi, generateKeys, sign }
