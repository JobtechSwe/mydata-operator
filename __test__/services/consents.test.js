const { createRequest, getRequest, create, get } = require('../../lib/services/consents')
const redis = require('../../lib/adapters/redis')
const postgres = require('../../lib/adapters/postgres')
const axios = require('axios')
jest.mock('../../lib/adapters/redis')
jest.mock('../../lib/adapters/postgres')
jest.mock('axios')

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
        clientId: 'mycv.com',
        scope: ['foo', 'bar']
      })

      expect(redis.set).toHaveBeenCalledTimes(1)
    })

    it('retries with new random id', async () => {
      redis.set.mockResolvedValueOnce('not-OK')

      await createRequest({
        clientId: 'mycv.com',
        scope: ['foo', 'bar']
      })

      expect(redis.set).toHaveBeenCalledTimes(2)
      expect(redis.set.mock.calls[0][0]).not.toBe(redis.set.mock.calls[0][1])
    })
  })

  describe('#getRequest', () => {
    it('returns an object', async () => {
      redis.get.mockResolvedValue('{"clientId":"mydearjohn.com","scope":["loveletters"]}')

      const result = await getRequest('5678')

      expect(result).toEqual({ clientId: 'mydearjohn.com', scope: ['loveletters'] })
    })
  })

  describe('#create', () => {
    const consentBody = {
      id: '809eea87-6182-4cb4-8d6e-df6d411149a2',
      clientId: 'hejnar',
      scope: [ 'stuff', 'things' ],
      accountId: '809eea87-6182-4cb4-8d6e-df6d411149a2'
    }

    let connection

    beforeEach(() => {
      connection = { query: jest.fn().mockResolvedValue(), end: jest.fn().mockResolvedValue() }
      postgres.connect.mockResolvedValue(connection)
    })

    it('fails if input is invalid', async () => {
      await expect(create({ blaj: 'asdasd' })).rejects.toThrow()
    })

    it('connects and writes to db', async () => {
      await create(consentBody)
      expect(postgres.connect).toHaveBeenCalled()
      expect(connection.query).toHaveBeenCalled()
    })

    it('posts to client', async () => {
      await create(consentBody)

      expect(axios.post).toBeCalledTimes(1)
    })
  })

  describe('#get', () => {
    let connection

    beforeEach(() => {
      connection = { query: jest.fn().mockResolvedValue(), end: jest.fn().mockResolvedValue() }
      postgres.connect.mockResolvedValue(connection)
    })

    it('connects and queries db', async () => {
      connection.query.mockResolvedValue({ rows: [ 'item', 'another-item' ] })
      await get('consent-id')
      expect(postgres.connect).toHaveBeenCalled()
      expect(connection.query).toHaveBeenCalled()
    })
  })
})
