const request = require('supertest')
const app = require(`${process.cwd()}/lib/app`)
const consentService = require(`${process.cwd()}/lib/services/consents`)
jest.mock(`${process.cwd()}/lib/services/consents`)

describe('routes /api/consents', () => {
  describe('POST: /requests', () => {
    let body
    beforeEach(() => {
      body = {
        client_id: 'mycv.com',
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
      client_id: 'mycv.com',
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
})
