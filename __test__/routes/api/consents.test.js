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
        scope: [
          { area: 'experience', reason: 'För att kunna bygga ditt CV' },
          { area: 'education', reason: 'För att kunna bygga ditt CV' },
          { area: 'languages', reason: 'För att kunna bygga ditt CV' },
          { namespace: 'personal', area: 'info', reason: 'För att kunna göra ditt CV mer personligt' }
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
    let consentRequest
    beforeEach(() => {
      consentRequest = {
        clientId: 'cv.work',
        kid: 'encryption-key-id',
        scope: [
          { area: 'experience', reason: 'För att kunna bygga ditt CV' },
          { area: 'education', reason: 'För att kunna bygga ditt CV' },
          { area: 'languages', reason: 'För att kunna bygga ditt CV' },
          { namespace: 'personal', area: 'info', reason: 'För att kunna göra ditt CV mer personligt' }
        ]
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
      redis.get.mockResolvedValue(JSON.stringify(consentRequest))

      const response = await api.get(`/api/consents/requests/${id}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: {
          ...consentRequest,
          jwksUrl: '/jwks',
          displayName: 'My CV',
          description: 'An app for your CV online'
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

  xdescribe('POST: /', () => {
    const consent = {
      clientId: 'mycv.com',
      scope: 'I want it all and I want it now'
    }

    it('should call the consent service', async () => {
      consentService.create.mockResolvedValue()

      await api.post('/api/consents', consent)

      expect(consentService.create).toBeCalledTimes(1)
      expect(consentService.create).toBeCalledWith(consent)
    })

    it('returns 400 if service throws ValidationError', async () => {
      const err = new Error('asdads')
      err.name = 'ValidationError'
      consentService.create.mockRejectedValue(err)

      const response = await api.post('/api/consents', consent)

      expect(response.status).toBe(400)
    })

    it('returns 500 if service throws other error', async () => {
      const err = new Error('asdads')
      consentService.create.mockRejectedValue(err)

      const response = await api.post('/api/consents', consent)

      expect(response.status).toBe(500)
    })
  })
})
