const app = require('../../../lib/app')
const clientService = require('../../../lib/services/clients')
const redis = require('../../../lib/adapters/redis')
const { createApi, generateKeys, sign } = require('../../helpers')
jest.mock('../../../lib/services/clients')
jest.mock('../../../lib/adapters/redis')

describe('routes /api/consents', () => {
  let clientKeys, api, cv
  beforeAll(async () => {
    clientKeys = await generateKeys('sig', 'client_key')
  })
  beforeEach(() => {
    api = createApi(app)
    cv = {
      clientId: 'cv.work',
      publicKey: clientKeys.publicKey,
      jwksUrl: '/jwks',
      eventsUrl: '/events',
      displayName: 'My CV',
      description: 'An app for your CV online'
    }
    clientService.get.mockResolvedValue(cv)
    redis.set.mockResolvedValue('OK')
  })
  const payload = (data) => ({
    data,
    signature: {
      kid: 'client_key',
      data: sign(data, clientKeys.privateKey)
    }
  })

  describe('POST: /requests', () => {
    let data
    beforeEach(() => {
      data = {
        clientId: 'cv.work',
        kid: 'encryption-key-id',
        expiry: 123143234,
        scope: [
          { domain: 'cv.work', area: 'experience', purpose: 'För att kunna bygga ditt CV', description: 'this data contains....', permissions: [ 'write' ], lawfulBasis: 'CONSENT', required: true },
          { domain: 'cv.work', area: 'education', purpose: 'För att kunna bygga ditt CV', description: 'this data contains....', permissions: [ 'write' ], lawfulBasis: 'CONSENT', required: true },
          { domain: 'cv.work', area: 'languages', purpose: 'För att kunna bygga ditt CV', description: 'this data contains....', permissions: [ 'write' ], lawfulBasis: 'CONSENT', required: true }
        ]
      }
    })
    it('throws a 400 if clientId is missing', async () => {
      data.clientId = undefined
      const response = await api.post('/api/consents/requests', payload(data))
      expect(response.status).toEqual(400)
    })
    it('throws a 400 if no encryption kid is specified', async () => {
      data.kid = undefined
      const response = await api.post('/api/consents/requests', payload(data))
      expect(response.status).toEqual(400)
    })
    it('throws a 400 if scope is missing', async () => {
      data.scope = undefined
      const response = await api.post('/api/consents/requests', payload(data))
      expect(response.status).toEqual(400)
    })
    it('throws a 400 if scope is empty', async () => {
      data.scope = []
      const response = await api.post('/api/consents/requests', payload(data))
      expect(response.status).toEqual(400)
    })
    it('saves consent request to redis if it validates', async () => {
      await api.post('/api/consents/requests', payload(data))
      expect(redis.set).toHaveBeenCalledWith(expect.stringMatching(/^consentRequest:*/), expect.any(String), 'NX', 'EX', 3600)
    })
  })

  describe('GET: /requests/:id', () => {
    let consentRequest, signature
    beforeEach(() => {
      consentRequest = {
        clientId: 'cv.work',
        kid: 'encryption-key-id',
        expiry: 123143234,
        scope: [
          { domain: 'cv.work', area: 'experience', purpose: 'För att kunna bygga ditt CV', description: 'this data contains....', permissions: ['write'], lawfulBasis: 'CONSENT', required: true },
          { domain: 'cv.work', area: 'education', purpose: 'För att kunna bygga ditt CV', description: 'this data contains....', permissions: ['write'], lawfulBasis: 'CONSENT', required: true },
          { domain: 'cv.work', area: 'languages', purpose: 'För att kunna bygga ditt CV', description: 'this data contains....', permissions: ['write'], lawfulBasis: 'CONSENT', required: true }
        ]
      }
      signature = {
        client: {
          clientId: 'cv.work',
          jwksUrl: '/jwks',
          eventsUrl: '/events',
          displayName: 'CV',
          description: 'This is Sparta',
          publicKey: 'RSA etc'
        },
        data: 'some-signature',
        key: 'RSA etc',
        kid: 'client_key'
      }

      redis.get.mockResolvedValue('')
    })

    it('gets request from redis', async () => {
      const id = '1234'

      await api.get(`/api/consents/requests/${id}`)

      expect(redis.get).toHaveBeenCalledWith(`consentRequest:${id}`)
    })

    it('should return 200 with data', async () => {
      const id = '1234'
      redis.get.mockResolvedValue(JSON.stringify({ body: consentRequest, signature }))

      const response = await api.get(`/api/consents/requests/${id}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: consentRequest,
        signature: {
          kid: 'client_key',
          data: 'some-signature'
        },
        client: {
          jwksUrl: '/jwks',
          displayName: 'CV',
          description: 'This is Sparta'
        }
      })
    })

    it('should return 404 without data', async () => {
      redis.get.mockResolvedValue(null)

      const id = '1234'
      const response = await api.get(`/api/consents/requests/${id}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({})
    })
  })
})
