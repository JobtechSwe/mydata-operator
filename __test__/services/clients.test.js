const { create, get } = require('../../lib/services/clients')
const postgres = require('../../lib/adapters/postgres')
jest.mock('../../lib/adapters/postgres')

describe('services/clients', () => {
  let connection
  beforeEach(() => {
    connection = {
      query: jest.fn(),
      end: jest.fn()
    }
    postgres.connect.mockResolvedValue(connection)
  })

  describe('#create', () => {
    let data
    beforeEach(() => {
      data = {
        clientId: 'mycv.example',
        displayName: 'mycv',
        description: 'this is the best app there is',
        jwksUrl: '/jwks',
        eventsUrl: '/events',
        publicKey: 'my-public-key'
      }
      connection.query.mockResolvedValue({
        rowCount: 1
      })
    })
    it('calls connect once', async () => {
      await create(data)
      expect(postgres.connect).toHaveBeenCalledTimes(1)
    })
    it('calls query with correct parameters', async () => {
      await create(data)
      expect(connection.query).toHaveBeenCalledWith(expect.any(String), [
        data.clientId,
        data.displayName,
        data.description,
        data.jwksUrl,
        data.eventsUrl,
        data.publicKey
      ])
    })
    it('throws if number of rows affected is not 1', async () => {
      connection.query.mockResolvedValue({ rowCount: 5 })
      await expect(create(data)).rejects.toThrow()
    })
    it('returns the client camelCased', async () => {
      const result = await create(data)
      expect(result).toEqual(data)
    })
  })
  describe('#get', () => {
    beforeEach(() => {
      connection.query.mockResolvedValue({
        rows: [{
          client_id: 'mycv.example',
          display_name: 'mycv',
          description: 'this is the best app there is',
          jwks_url: '/jwks',
          events_url: 'events',
          public_key: 'my-public-key'
        }]
      })
    })
    it('calls connect once', async () => {
      await get('mycv.example')
      expect(postgres.connect).toHaveBeenCalledTimes(1)
    })
    it('returns the data camelCased', async () => {
      const result = await get('mycv.example')
      expect(result).toEqual({
        clientId: 'mycv.example',
        displayName: 'mycv',
        description: 'this is the best app there is',
        jwksUrl: '/jwks',
        eventsUrl: 'events',
        publicKey: 'my-public-key'
      })
    })
  })
})
