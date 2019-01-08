const express = require('express')
const clientsService = require('../../lib/services/clients')
const { signed } = require('../../lib/middleware/auth')
const jwksProvider = require('jwks-provider')
const { createApi, generateKeys, sign } = require('../helpers')

jest.mock('../../lib/services/clients')

describe('/middleware/auth', () => {
  let clientKey
  beforeAll(async () => {
    clientKey = await generateKeys('sig', 'client_key')
  })
  let app, route, api, cv
  beforeEach(() => {
    cv = {
      clientId: 'mydata.work',
      publicKey: clientKey.publicKey,
      displayName: 'My CV',
      description: 'An app',
      jwksUrl: '/jwks',
      eventsUrl: '/events'
    }
    clientsService.get.mockResolvedValue(cv)

    route = jest.fn((req, res) => res.send({})).mockName('route')
    app = express()
    app.use(express.json())
    app.post('/unsafe', signed({ unsafe: true }), route)
    app.post('/safe', signed({}), route)
    app.post('/accounts', signed({ unsafe: true, withKey: true }), route)

    app.use((err, req, res, next) => res.status(err.status).send(err))

    api = createApi(app)
  })
  describe('#signed', () => {
    let payload
    describe('with clientId and kid', () => {
      beforeEach(() => {
        payload = {
          data: {
            clientId: 'mydata.work',
            unsafe: true,
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
        const res = await api.post('/unsafe', {})
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if no data is present', async () => {
        payload.data = undefined
        const res = await api.post('/unsafe', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if no signature is present', async () => {
        payload.signature = undefined
        const res = await api.post('/unsafe', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if data.clientId is missing', async () => {
        payload.data.clientId = undefined
        const res = await api.post('/unsafe', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if signature.kid is missing', async () => {
        payload.signature.kid = undefined
        const res = await api.post('/unsafe', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if signature.data is missing', async () => {
        payload.signature.data = undefined
        const res = await api.post('/unsafe', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 403 if unsafe is true but not allowed', async () => {
        clientsService.get.mockResolvedValue()
        const res = await api.post('/safe', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(403)
        expect(res.body.message).toEqual('Unsafe host not allowed')
      })
      it('throws 401 if kid is client_key and clientId cannot be found', async () => {
        clientsService.get.mockResolvedValue()
        const res = await api.post('/unsafe', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(401)
        expect(res.body.message).toEqual('Unknown clientId')
      })
      it('throws 403 if signature cannot be validated', async () => {
        payload.signature.data = 'bork'
        const res = await api.post('/unsafe', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(403)
        expect(res.body.message).toEqual('Invalid signature')
      })
      it('calls route with data part of payload if signature is verified', async () => {
        await api.post('/unsafe', payload)
        expect(route).toHaveBeenCalled()
        const [[req]] = route.mock.calls
        expect(req.body).toEqual(payload.data)
      })
      describe('verifying through calling jwks endpoint', () => {
        let server, signingKey
        beforeEach(async () => {
          signingKey = await generateKeys('sig', 'some_other_signing_key')

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
          const res = await api.post('/unsafe', payload)
          expect(res.status).toEqual(401)
          expect(res.body.message).toEqual('Could not retrieve key')
        })
        it('calls route with data part of payload if signature is verified', async () => {
          const res = await api.post('/unsafe', payload)
          expect(res.status).toEqual(200)
          expect(route).toHaveBeenCalled()
          const [[req]] = route.mock.calls
          expect(req.body).toEqual(payload.data)
        })
        it('sets req.signature.client', async () => {
          const res = await api.post('/unsafe', payload)
          expect(res.status).toEqual(200)
          expect(route).toHaveBeenCalled()
          const [[req]] = route.mock.calls
          expect(req.signature.client).toEqual(cv)
        })
      })
    })
    describe('register client', () => {
      let server
      beforeEach(async () => {
        // No client exists
        clientsService.get.mockResolvedValue()

        const jwksUrl = '/api/jwksUrl'

        // Start server
        const clientApp = express()
        clientApp.use(express.json())
        clientApp.get(jwksUrl, (req, res) => {
          res.send(jwksProvider.serialize([clientKey]))
        })
        return new Promise((resolve) => {
          server = clientApp.listen(() => {
            payload.data.clientId = `localhost:${server.address().port}`
            payload.data.jwksUrl = jwksUrl
            payload.signature.kid = 'client_key'
            payload.signature.data = sign(payload.data, clientKey.privateKey)
            resolve()
          })
        })
      })
      afterEach(async () => {
        await server.close()
      })
      it('calls register route with data part of payload if signature is verified', async () => {
        const res = await api.post('/unsafe', payload)
        expect(res.status).toEqual(200)
        expect(route).toHaveBeenCalled()
        const [[req]] = route.mock.calls
        expect(req.body).toEqual(payload.data)
      })
      it('does not set req.signature.client', async () => {
        clientsService.get.mockResolvedValue()
        const res = await api.post('/unsafe', payload)
        expect(res.status).toEqual(200)
        expect(route).toHaveBeenCalled()
        const [[req]] = route.mock.calls
        expect(req.signature.client).toEqual(undefined)
      })
    })
    describe('with publicKey', () => {
      beforeEach(async () => {
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
        const res = await api.post('/accounts', {})
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if no data is present', async () => {
        payload.data = undefined
        const res = await api.post('/accounts', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if no signature is present', async () => {
        payload.signature = undefined
        const res = await api.post('/accounts', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if data.publicKey is missing', async () => {
        payload.data.publicKey = undefined
        const res = await api.post('/accounts', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 400 if signature.data is missing', async () => {
        payload.signature.data = undefined
        const res = await api.post('/accounts', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(400)
        expect(res.body.name).toEqual('ValidationError')
      })
      it('throws 403 if signature cannot be validated', async () => {
        payload.signature.data = 'bork'
        const res = await api.post('/accounts', payload)
        expect(route).not.toBeCalled()
        expect(res.status).toEqual(403)
        expect(res.body.message).toEqual('Invalid signature')
      })
      it('calls route with data part of payload if signature is verified', async () => {
        await api.post('/accounts', payload)
        expect(route).toHaveBeenCalled()
        const [[req]] = route.mock.calls
        expect(req.body).toEqual(payload.data)
      })
    })
  })
})
