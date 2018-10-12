const request = require('supertest')
const app = require('../../lib/app')
const redis = require('../../lib/adapters/redis')
const { createHash } = require('crypto')

describe('Integration: routes/consent', () => {
  describe('request consent', () => {
    let consentRequest, consentRequestId
    beforeEach(() => {
      consentRequest = {
        account_id: '12345',
        client_id: 'dfgdfgdfgg',
        scope: ['read'],
        description: 'DO IT!'
      }
      consentRequestId = createHash('SHA256')
        .update(JSON.stringify({
          account_id: consentRequest.account_id,
          client_id: consentRequest.client_id
        }))
        .digest()
        .toString('base64')
    })
    afterEach(async () => {
      await redis.del(consentRequestId)
    })
    it('stores consentRequest in redis', async () => {
      const { body: { data } } = await request(app)
        .post('/consents')
        .accept('application/json')
        .set({ 'Content-Type': 'application/json' })
        .send(consentRequest)
      expect(redis.getJson(data.id)).resolves.toEqual(data)
    })
    it('stores gives consentRequest a correct id', async () => {
      const { body: { data } } = await request(app)
        .post('/consents')
        .accept('application/json')
        .set({ 'Content-Type': 'application/json' })
        .send(consentRequest)
      expect(data.id).toEqual(consentRequestId)
    })
    describe('get consent status', () => {
      beforeEach(async () => {
        await request(app)
          .post('/consents')
          .accept('application/json')
          .set({ 'Content-Type': 'application/json' })
          .send(consentRequest)
      })
      it('returns the consent', async () => {
        const { body: { data } } = await request(app)
          .get(`/consents/${consentRequestId}`)
          .accept('application/json')
        expect(data).toEqual(Object.assign({ id: consentRequestId }, consentRequest))
      })
    })
  })
})