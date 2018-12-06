const { create } = require('../../lib/services/apps')
const postgres = require('../../lib/adapters/postgres')
jest.mock('../../lib/adapters/postgres')

describe('services/apps', () => {
  let connection

  beforeEach(() => {
    connection = {
      query: jest.fn(),
      end: jest.fn()
    }
    postgres.connect.mockResolvedValue(connection)
  })

  describe('#create', () => {
    let validBody

    beforeEach(() => {
      validBody = {
        name: 'mycv',
        description: 'this is the best app there is',
        clientId: 'mycv.example',
        jwksUrl: 'mycv.example/.well-known/jwks'
      }
    })

    it('calls connect once', async () => {
      await create(validBody)

      expect(postgres.connect).toHaveBeenCalledTimes(1)
    })

    it('rejects if schema is not fullfilled', async () => {
      await expect(create({})).rejects.toThrow()
    })

    it('returns fine if schema is fullfilled', async () => {
      expect(await create(validBody)).toEqual({ name: validBody.name })
    })
  })
})
