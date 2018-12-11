const request = require('supertest')
const app = require(`${process.cwd()}/lib/app`)
const redis = require(`${process.cwd()}/lib/adapters/redis`)
const { createHash } = require('crypto')

describe('Integration: routes /api/consents', () => {
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
        .post('/api/consents')
        .accept('application/json')
        .set({ 'Content-Type': 'application/json' })
        .send(consentRequest)
      expect(redis.getJson(`consent:${data.id}`)).resolves.toEqual(data)
    })
    it('stores gives consentRequest a correct id', async () => {
      const { body: { data } } = await request(app)
        .post('/api/consents')
        .accept('application/json')
        .set({ 'Content-Type': 'application/json' })
        .send(consentRequest)
      expect(data.id).toEqual(consentRequestId)
    })
    describe('get consent status', () => {
      beforeEach(async () => {
        await request(app)
          .post('/api/consents')
          .accept('application/json')
          .set({ 'Content-Type': 'application/json' })
          .send(consentRequest)
      })
      it('returns the consent', async () => {
        const { body: { data } } = await request(app)
          .get(`/api/consents/${consentRequestId}`)
          .accept('application/json')
        expect(data).toEqual(Object.assign({ id: consentRequestId, status: 'pending' }, consentRequest))
      })
    })
  })
})
