const { create, get } = require('../../lib/services/accounts')
const postgres = require('../../lib/adapters/postgres')
jest.mock('../../lib/adapters/redis')
jest.mock('../../lib/adapters/postgres')

describe('services/accounts', () => {
  let connection
  beforeEach(() => {
    connection = { query: jest.fn().mockResolvedValue(), end: jest.fn().mockResolvedValue() }
    postgres.connect.mockResolvedValue(connection)
  })
  describe('#create', () => {
    it('fails if the input is invalid', async () => {
      await expect(create({})).rejects.toThrow()
    })
    it('saves to postgres with id, username and hashed password', async () => {
      const account = { username: 'einar', password: 'abcdefghijk' }
      await create(account)
      expect(postgres.connect).toHaveBeenCalled()
      expect(connection.query).toHaveBeenCalledWith(expect.any(String), [expect.any(String), account.username, expect.any(Buffer)])
    })
    it('returns the account', async () => {
      const account = { username: 'einar', password: 'abcdefghijk' }
      const result = await create(account)
      expect(result).toEqual({
        id: expect.any(String),
        username: account.username
      })
    })
    it('closes the connection on success', async () => {
      const account = { username: 'einar', password: 'abcdefghijk' }
      await create(account)
      expect(connection.end).toHaveBeenCalled()
    })
    it('closes the connection on fail', async () => {
      const account = { username: 'einar', password: 'abcdefghijk' }
      connection.query.mockRejectedValue(new Error())

      try {
        await create(account)
      } catch (err) { }
      expect(connection.end).toHaveBeenCalled()
    })
  })
  describe('#get', () => {
    it('fails if the input is invalid', async () => {
      await expect(get()).rejects.toThrow()
    })
    it('gets from postgres by id', async () => {
      const id = 'abc-123'
      connection.query.mockResolvedValue({ rows: [{ id }] })
      await get(id)
      expect(connection.query).toHaveBeenCalledWith(expect.any(String), [id])
    })
    it('returns the account', async () => {
      const id = 'abc-123'
      connection.query.mockResolvedValue({ rows: [{ id }] })
      const result = await get(id)
      expect(result).toEqual({ id })
    })
  })
})
