const request = require('supertest')
const app = require('../../../lib/app')
const consentService = require('../../../lib/services/consents')
const clientService = require('../../../lib/services/clients')
const redis = require('../../../lib/adapters/redis')
const { createApi, generateKeys, sign } = require('../../helpers')
jest.mock('../../../lib/services/clients')
jest.mock('../../../lib/adapters/redis')

describe('routes /api/consents', () => {
  let clientKeys, api, cv
  beforeAll(async () => {
    clientKeys = await generateKeys('sig', 'client_key')
    api = createApi(app)
  })
  beforeEach(() => {
    cv = {
      clientId: 'cv.work',
      publicKey: clientKeys.publicKey
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
      const res = await api.post('/api/consents/requests', payload(data))
      expect(res.status).toEqual(400)
    })
    xit('throws a 400 if scope is missing', async () => {
      data.scope = undefined
      const res = await api.post('/api/consents/requests', payload(data))
      expect(res.status).toEqual(400)
    })
    xit('throws a 400 if scope is empty', async () => {
      data.scope = []
      const res = await api.post('/api/consents/requests', payload(data))
      expect(res.status).toEqual(400)
    })
    xit('saves consent request to redis if it validates', async () => {
      await api.post('/api/consents/requests', payload(data))
      expect(redis.set).toHaveBeenCalledWith('')
    })
  })

  xdescribe('GET: /requests/:id', () => {
    const consentRequestBody = {
      clientId: 'mycv.com',
      scope: ['foo', 'bar']
    }

    it('calls consentService.getRequest()', async () => {
      const id = '1234'
      consentService.getRequest.mockResolvedValue(consentRequestBody)

      await request(app).get(`/api/consents/requests/${id}`)

      expect(consentService.getRequest).toHaveBeenCalledWith(id)
    })

    it('should return 200 with data', async () => {
      const id = '1234'
      consentService.getRequest.mockResolvedValue(consentRequestBody)

      const response = await request(app).get(`/api/consents/requests/${id}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ data: consentRequestBody })
    })

    it('should return 404 without data', async () => {
      const id = '1234'
      consentService.getRequest.mockResolvedValue(null)

      const response = await request(app).get(`/api/consents/requests/${id}`)

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

      await request(app)
        .post('/api/consents')
        .send(consent)

      expect(consentService.create).toBeCalledTimes(1)
      expect(consentService.create).toBeCalledWith(consent)
    })

    it('returns 400 if service throws ValidationError', async () => {
      const err = new Error('asdads')
      err.name = 'ValidationError'
      consentService.create.mockRejectedValue(err)

      const response = await request(app)
        .post('/api/consents')
        .send(consent)

      expect(response.status).toBe(400)
    })

    it('returns 500 if service throws other error', async () => {
      const err = new Error('asdads')
      consentService.create.mockRejectedValue(err)

      const response = await request(app)
        .post('/api/consents')
        .send(consent)

      expect(response.status).toBe(500)
    })
  })
})
