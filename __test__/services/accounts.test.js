const { create, get } = require('../../lib/services/accounts')
const redis = require('../../lib/adapters/redis')
jest.mock('../../lib/adapters/redis')

describe('services/accounts', () => {
  describe('#create', () => {
    it('fails if the input is invalid', async () => {
      await expect(create({})).rejects.toThrow()
    })
    it('saves to redis with id as key', async () => {
      const account = { id: 'einar' }
      redis.setJson.mockResolvedValue(account)
      await create(account)
      expect(redis.setJson).toHaveBeenCalledWith(`account:${account.id}`, account)
    })
    it('returns the account', async () => {
      const account = { id: 'einar' }
      redis.setJson.mockResolvedValue(account)
      const result = await create(account)
      expect(result).toEqual(account)
    })
  })
  describe('#get', () => {
    it('fails if the input is invalid', async () => {
      await expect(get()).rejects.toThrow()
    })
    it('gets from redis by id', async () => {
      const id = 'einar'
      redis.getJson.mockResolvedValue({ id })
      await get(id)
      expect(redis.getJson).toHaveBeenCalledWith(`account:${id}`)
    })
    it('returns the account', async () => {
      const id = 'einar'
      redis.getJson.mockResolvedValue({ id })
      const result = await get(id)
      expect(result).toEqual({ id })
    })
  })
})
