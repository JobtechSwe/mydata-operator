const { get } = require('../../../lib/services/consents')
const redis = require('../../../lib/adapters/redis')
const postgres = require('../../../lib/adapters/postgres')
jest.mock('../../../lib/adapters/redis')
jest.mock('../../../lib/adapters/postgres')

describe('services/consents #get', () => {
  let connection
  beforeEach(() => {
    redis.set.mockResolvedValue('OK')
    connection = {
      query: jest.fn().mockResolvedValue({ rows: [{}] }),
      end: jest.fn().mockResolvedValue()
    }
    postgres.connect.mockResolvedValue(connection)
  })

  it('connects and queries db', async () => {
    connection.query.mockResolvedValue({ rows: ['item', 'another-item'] })
    await get('consent-id')
    expect(postgres.connect).toHaveBeenCalled()
    expect(connection.query).toHaveBeenCalled()
  })
})
