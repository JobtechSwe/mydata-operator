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
    let account
    beforeEach(() => {
      account = {
        firstName: 'Einar',
        lastName: 'Persson',
        publicKey: Buffer.from('-----BEGIN RSA PUBLIC KEY----- ...').toString('base64'),
        pds: {
          provider: 'dropbox',
          access_token: 'asdasdasd'
        }
      }
    })
    it('fails if the input is invalid', async () => {
      await expect(create({})).rejects.toThrow()
    })
    it('calls connect and query', async () => {
      await create(account)
      expect(postgres.connect).toHaveBeenCalled()
      expect(connection.query).toHaveBeenCalled()
    })
    it('saves to db with correct parameters', async () => {
      await create(account)
      expect(connection.query).toHaveBeenCalledWith(expect.any(String), [
        expect.any(String), // uuid
        '-----BEGIN RSA PUBLIC KEY----- ...', // public key
        account.pds.provider,
        expect.any(Buffer)
      ])
    })
    it('returns the account id', async () => {
      const result = await create(account)
      expect(result).toEqual({
        id: expect.any(String)
      })
    })
    it('closes the connection on success', async () => {
      await create(account)
      expect(connection.end).toHaveBeenCalled()
    })
    it('closes the connection on fail', async () => {
      connection.query.mockRejectedValue(new Error())

      try {
        await create(account)
      } catch (err) { }
      expect(connection.end).toHaveBeenCalled()
    })
  })
  describe('#get', () => {
    let accountId
    beforeEach(() => {
      accountId = '2982bf9d-cda1-4a2a-ae1b-189cf7f65673'
    })
    it('fails if the input is invalid', async () => {
      await expect(get()).rejects.toThrow()
    })
    it('gets from postgres by id', async () => {
      connection.query.mockResolvedValue({ rows: [{ id: accountId }] })
      await get(accountId)
      expect(connection.query).toHaveBeenCalledWith(expect.any(String), [accountId])
    })
    it('returns the account', async () => {
      connection.query.mockResolvedValue({ rows: [{ id: accountId }] })
      const result = await get(accountId)
      expect(result).toEqual({ id: accountId })
    })
    it('returns pdsCredentials as base64', async () => {
      const pdsCredentials = {
        0: 0x7b,
        1: 0x7d
      }
      const credentialsString = Buffer.from([0x7b, 0x7d]).toString('base64')
      connection.query.mockResolvedValue({ rows: [{ id: accountId, pdsCredentials }] })
      const result = await get(accountId)
      expect(result).toEqual({ id: accountId, pdsCredentials: credentialsString })
    })
  })
})
