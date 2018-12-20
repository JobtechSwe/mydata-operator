const request = require('supertest')
const express = require('express')
const clientsService = require('../../lib/services/clients')
const { signed } = require('../../lib/middleware/auth')
const { generateKeyPair, createSign } = require('crypto')
const { promisify } = require('util')
const jwksProvider = require('jwks-provider')

jest.mock('../../lib/services/clients')

const generate = async (use, kid) => {
  const { publicKey, privateKey } = await promisify(generateKeyPair)('rsa', {
    modulusLength: 1024,
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
  })
  return { use, kid, publicKey, privateKey }
}
const sign = (data, privateKey) => {
  return createSign('SHA256')
    .update(JSON.stringify(data))
    .sign(privateKey, 'base64')
}

describe('/middleware/auth', () => {
  let clientKey
  beforeAll(async () => {
    clientKey = await generate('sig', 'client_key')
  })
  let app, route, api, cv
  beforeEach(() => {
    cv = {
      clientId: 'mydata.work',
      publicKey: clientKey.publicKey,
      displayName: 'My CV',
      description: 'An app',
      jwksUrl: '/jwks'
    }
    clientsService.get.mockResolvedValue(cv)

    app = express()
    app.use(express.json())
    route = jest.fn((req, res) => res.send({})).mockName('route')
  })
  const apiClient = (app) => ({
    post: (route, data) => request(app)
      .post(route)
      .set({ 'Content-Type': 'application/json' })
      .send(data)
  })
  describe('#signed', () => {
    let payload
    describe('with clientId and kid', () => {
      beforeEach(() => {
        app.post('/', signed({ unsafe: true }), route)
        app.use((err, req, res, next) => res.status(err.status).send(err))
        api = apiClient(app)

        payload = {
          data: {
            clientId: 'mydata.work',
            foo: 'bar'
          },
          signature: {
            data: '',
            kid: 'client_key'
          }
        }
        payload.signature.data = sign(payload.data, clientKey.privateKey)
      })
      it('gives a validation error if data and signature are not present', async () => {
        const res = await api.post('/', {})
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if no data is present', async () => {
        payload.data = undefined
        const res = await api.post('/', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if no signature is present', async () => {
        payload.signature = undefined
        const res = await api.post('/', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if data.clientId is missing', async () => {
        payload.data.clientId = undefined
        const res = await api.post('/', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if signature.kid is missing', async () => {
        payload.signature.kid = undefined
        const res = await api.post('/', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if signature.data is missing', async () => {
        payload.signature.data = undefined
        const res = await api.post('/', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 401 if kid is client_key and clientId cannot be found', async () => {
        clientsService.get.mockResolvedValue()
        const res = await api.post('/', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(401)
        expect(res.body.message).toEqual('Unknown clientId')
      })
      it('throws 403 if signature cannot be validated', async () => {
        payload.signature.data = 'bork'
        const res = await api.post('/', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(403)
        expect(res.body.message).toEqual('Invalid signature')
      })
      it('calls route with data part of payload if signature is verified', async () => {
        await api.post('/', payload)
        expect(route).toHaveBeenCalled()
        const [[req]] = route.mock.calls
        expect(req.body).toEqual(payload.data)
      })
      describe('verifying through calling jwks endpoint', () => {
        let server, signingKey
        beforeEach(async () => {
          signingKey = await generate('sig', 'some_other_signing_key')

          const app = express()
          app.use(express.json())
          app.get(cv.jwksUrl, (req, res) => {
            res.send(jwksProvider.serialize([clientKey, signingKey]))
          })
          return new Promise((resolve) => {
            server = app.listen(() => {
              payload.data.clientId = cv.clientId = `localhost:${server.address().port}`
              payload.signature.kid = signingKey.kid
              payload.signature.data = sign(payload.data, signingKey.privateKey)
              resolve()
            })
          })
        })
        afterEach(async () => {
          await server.close()
        })
        it('throws a 401 if specified key cannot be retrieved', async () => {
          cv.jwksUrl = '/wrong/url'
          const res = await api.post('/', payload)
          expect(res.status).toEqual(401)
          expect(res.body.message).toEqual('Could not retrieve key')
        })
        it('works', async () => {
          const res = await api.post('/', payload)
          expect(res.status).toEqual(200)
          expect(route).toHaveBeenCalled()
          const [[req]] = route.mock.calls
          expect(req.body).toEqual(payload.data)
        })
      })
    })
    describe('with publicKey', () => {
      beforeEach(async () => {
        app.post('/', signed({ unsafe: true, withKey: true }), route)
        app.use((err, req, res, next) => res.status(err.status).send(err))
        api = apiClient(app)

        payload = {
          data: {
            publicKey: clientKey.publicKey,
            foo: 'bar'
          },
          signature: {
            data: ''
          }
        }
        payload.signature.data = sign(payload.data, clientKey.privateKey)
      })
      it('gives a validation error if data and signature are not present', async () => {
        const res = await api.post('/', {})
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if no data is present', async () => {
        payload.data = undefined
        const res = await api.post('/', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if no signature is present', async () => {
        payload.signature = undefined
        const res = await api.post('/', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if data.publicKey is missing', async () => {
        payload.data.publicKey = undefined
        const res = await api.post('/', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if signature.data is missing', async () => {
        payload.signature.data = undefined
        const res = await api.post('/', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 403 if signature cannot be validated', async () => {
        payload.signature.data = 'bork'
        const res = await api.post('/', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(403)
        expect(res.body.message).toEqual('Invalid signature')
      })
      it('calls route with data part of payload if signature is verified', async () => {
        await api.post('/', payload)
        expect(route).toHaveBeenCalled()
        const [[req]] = route.mock.calls
        expect(req.body).toEqual(payload.data)
      })
    })
  })
})
