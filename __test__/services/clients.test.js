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
        name: 'mycv',
        description: 'this is the best app there is',
        jwksUrl: '/jwks'
      }

      connection.query.mockResolvedValue({
        rowCount: 1
      })
    })

    it('calls connect once', async () => {
      await create(data)

      expect(postgres.connect).toHaveBeenCalledTimes(1)
    })

    it('throws if number of rows affected is not 1', async () => {
      connection.query.mockResolvedValue(5)

      await expect(create(data)).rejects.toThrow()
    })
  })

  describe('#get', () => {
    beforeEach(() => {
      connection.query.mockResolvedValue({
        rows: [{
          clientId: 'mycv.example',
          display_name: 'mycv',
          description: 'this is the best app there is',
          jwks_url: '/jwks',
          public_key: 'asdsadads'
        }]
      })
    })

    it('calls connect once', async () => {
      await get('mycv.example')

      expect(postgres.connect).toHaveBeenCalledTimes(1)
    })
  })
})
