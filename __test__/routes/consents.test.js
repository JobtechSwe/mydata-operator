const request = require('supertest')
const app = require('../../lib/app')
const consentService = require('../../lib/services/consents')
jest.mock('../../lib/services/consents')

describe('routes/consents', () => {
  describe('POST: /', () => {
    let consentRequest, consent
    beforeEach(() => {
      consentRequest = {}
      consent = {
        id: 'abc-123'
      }
    })
    it('calls consentService.request()', async () => {
      consentService.request.mockResolvedValue(consent)
      await request(app).post('/consents', consentRequest)

      expect(consentService.request).toHaveBeenCalledWith(consentRequest)
    })
    it('returns a 400 error if payload is bad', async () => {
      const error = Object.assign(new Error('Bad request'), { name: 'ValidationError' })
      consentService.request.mockRejectedValue(error)
      const response = await request(app).post('/consents', consentRequest)

      expect(response.status).toEqual(400)
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
    it('sets status created if succesful', async () => {
      consentService.request.mockResolvedValue(consent)
      const response = await request(app).post('/consents', consentRequest)

      expect(response.status).toEqual(201)
    })
    it('returns the new consent if succesful', async () => {
      consentService.request.mockResolvedValue(consent)
      const response = await request(app).post('/consents', consentRequest)

      expect(response.body.data).toEqual(consent)
    })
    it('returns the consent url if succesful', async () => {
      consentService.request.mockResolvedValue(consent)
      const response = await request(app).post('/consents', consentRequest)

      expect(response.body.links).toEqual({ self: '/consents/abc-123' })
    })
    it('returns an encoded url', async () => {
      consentService.request.mockResolvedValue({ id: 'this+id/has-to--be/encoded' })
      const response = await request(app).post('/consents', consentRequest)

      expect(response.body.links).toEqual({ self: '/consents/this%2Bid%2Fhas-to--be%2Fencoded' })
    })
    it('returns a 500 error if service borks', async () => {
      const error = new Error('b0rk')
      consentService.request.mockRejectedValue(error)
      const response = await request(app).post('/consents', consentRequest)

      expect(response.status).toEqual(500)
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
  })
  describe('GET: /:id', () => {
    let consentId, consent
    beforeEach(() => {
      consentId = 'abc-123'
      consent = {
        id: 'abc-123'
      }
    })
    it('calls consentService.get()', async () => {
      consentService.get.mockResolvedValue(consent)
      await request(app).get(`/consents/${consentId}`)

      expect(consentService.get).toHaveBeenCalledWith(consentId)
    })
    it('sets status 404 if consent was not found', async () => {
      consentService.get.mockResolvedValue(undefined)
      const response = await request(app).get(`/consents/${consentId}`)

      expect(response.status).toEqual(404)
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
    it('sets status 200 if consent was found', async () => {
      consentService.get.mockResolvedValue(consent)
      const response = await request(app).get(`/consents/${consentId}`)

      expect(response.status).toEqual(200)
    })
    it('returns consent if it was found', async () => {
      consentService.get.mockResolvedValue(consent)
      const response = await request(app).get(`/consents/${consentId}`)

      expect(response.body).toEqual({
        data: consent,
        links: { self: '/consents/abc-123' }
      })
    })
    it('returns a 500 if service borks', async () => {
      consentService.get.mockRejectedValue(new Error('b0rk'))
      const response = await request(app).get(`/consents/${consentId}`)

      expect(response.status).toEqual(500)
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
  })
})
