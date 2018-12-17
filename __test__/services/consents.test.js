const { createRequest, getRequest, create, get } = require('../../lib/services/consents')
const redis = require('../../lib/adapters/redis')
const postgres = require('../../lib/adapters/postgres')
const clientsService = require('../../lib/services/clients')
const axios = require('axios')
jest.mock('../../lib/adapters/redis')
jest.mock('../../lib/adapters/postgres')
jest.mock('../../lib/services/clients')
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
    it('tries to get request from Redis', () => {
      getRequest('5678')
      expect(redis.get).toBeCalledWith('consentRequest:5678')
    })
    it('uses client_id to get client from Postgres', async () => {
      redis.get.mockResolvedValue('{"client_id":"mydearjohn.com","scope":["loveletters"]}')
      clientsService.get.mockResolvedValue({})
      await getRequest('5678')
      expect(clientsService.get).toBeCalledWith('mydearjohn.com')
    })
    it('merges request and client and returns it', async () => {
      redis.get.mockResolvedValue('{"client_id":"mydearjohn.com","scope":["loveletters"]}')
      clientsService.get.mockResolvedValue({
        client_id: 'mydearjohn.com',
        displayName: 'My dear John'
      })
      const result = await getRequest('5678')
      expect(result).toEqual({
        request: {
          client_id: 'mydearjohn.com',
          scope: ['loveletters']
        },
        client: {
          client_id: 'mydearjohn.com',
          displayName: 'My dear John'
        }
      })
    })
  })

  describe('#create', () => {
    const consentBody = {
      id: '809eea87-6182-4cb4-8d6e-df6d411149a2',
      client_id: 'hejnar',
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
