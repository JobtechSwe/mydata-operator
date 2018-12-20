const request = require('supertest')
const app = require(`${process.cwd()}/lib/app`)
const consentService = require(`${process.cwd()}/lib/services/consents`)
jest.mock(`${process.cwd()}/lib/services/consents`)

xdescribe('routes /api/consents', () => {
  describe('POST: /requests', () => {
    let body
    beforeEach(() => {
      body = {
        clientId: 'mycv.com',
        scope: ['foo', 'bar']
      }
    })
    it('calls consentService.createRequest()', async () => {
      consentService.createRequest.mockResolvedValue('1234')

      await request(app).post('/api/consents/requests').send(body)

      expect(consentService.createRequest).toHaveBeenCalledWith(body)
    })
  })

  describe('GET: /requests/:id', () => {
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

  describe('POST: /', () => {
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
