const { createRequest, getRequest } = require('../../lib/services/consents')
const redis = require('../../lib/adapters/redis')
jest.mock('../../lib/adapters/redis')

describe('services/consents', () => {
  beforeEach(() => {
    redis.set.mockResolvedValue('OK')
  })

  describe('#createRequest', () => {
    it('fails if the input is invalid', async () => {
      await expect(createRequest({})).rejects.toThrow()
    })

    it('calls redis.set', async () => {
      await createRequest({
        client_id: 'mycv.com',
        scope: ['foo', 'bar']
      })

      expect(redis.set).toHaveBeenCalledTimes(1)
    })

    it('retries with new random id', async () => {
      redis.set.mockResolvedValueOnce('not-OK')

      await createRequest({
        client_id: 'mycv.com',
        scope: ['foo', 'bar']
      })

      expect(redis.set).toHaveBeenCalledTimes(2)
      expect(redis.set.mock.calls[0][0]).not.toBe(redis.set.mock.calls[0][1])
    })
  })

  describe('#getRequest', () => {
    it('returns an object', async () => {
      redis.get.mockResolvedValue('{"client_id":"mydearjohn.com","scope":["loveletters"]}')

      const result = await getRequest('5678')

      expect(result).toEqual({ client_id: 'mydearjohn.com', scope: ['loveletters'] })
    })
  })
})
