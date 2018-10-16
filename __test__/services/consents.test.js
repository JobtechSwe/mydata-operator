const { createHash } = require('crypto')
const { request, get } = require('../../lib/services/consents')
const redis = require('../../lib/adapters/redis')
jest.mock('../../lib/adapters/redis')

describe('services/consents', () => {
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
  describe('#request', () => {
    it('fails if the input is invalid', async () => {
      await expect(request({})).rejects.toThrow()
    })
    it('saves to redis with hashed key', async () => {
      redis.setJson.mockResolvedValue({})
      await request(consentRequest)
      expect(redis.setJson).toHaveBeenCalledWith(`consent:${consentRequestId}`, expect.any(Object))
    })
    it('returns the consent with an id', async () => {
      redis.setJson.mockResolvedValue(consentRequest)
      const result = await request(consentRequest)
      expect(result).toEqual(Object.assign({ id: consentRequestId }, consentRequest))
    })
  })
  describe('#get', () => {
    it('fails if the input is invalid', async () => {
      await expect(get()).rejects.toThrow()
    })
    it('gets from redis by id', async () => {
      const id = 'abc-123'
      redis.getJson.mockResolvedValue(consentRequest)
      await get(id)
      expect(redis.getJson).toHaveBeenCalledWith(`consent:${id}`)
    })
    it('returns the account', async () => {
      const id = 'abc-123'
      redis.getJson.mockResolvedValue(consentRequest)
      const result = await get(id)
      expect(result).toEqual(consentRequest)
    })
  })
})
