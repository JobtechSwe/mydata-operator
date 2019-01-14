const { createApi, generateKeys, sign } = require('../../helpers')
const app = require('../../../lib/app')
const postgres = require('../../../lib/adapters/postgres')

jest.mock('../../../lib/adapters/postgres')
jest.mock('../../../lib/adapters/pds')

describe('routes /api/accounts', () => {
  let api, accountKeys, connection
  beforeAll(async () => {
    accountKeys = await generateKeys('sig')
  })
  beforeEach(() => {
    api = createApi(app)
    connection = {
      query: jest.fn().mockResolvedValue({}),
      end: jest.fn()
    }
    postgres.connect.mockResolvedValue(connection)
  })
  const payload = (data) => ({
    data,
    signature: {
      alg: 'RSA-SHA512',
      data: sign('RSA-SHA512', data, accountKeys.privateKey)
    }
  })
  describe('POST: /', () => {
    let account
    beforeEach(() => {
      account = {
        publicKey: Buffer.from(accountKeys.publicKey).toString('base64'),
        pds: {
          provider: 'dropbox',
          access_token: 'some access token'
        }
      }
    })
    it('creates an account', async () => {
      await api.post('/api/accounts', payload(account))

      expect(connection.query).toHaveBeenCalledWith(expect.any(String), [
        expect.any(String), // uuid,
        accountKeys.publicKey,
        account.pds.provider,
        expect.any(Buffer) // pds access_token
      ])
    })
    it('returns a 400 error if payload is bad', async () => {
      account.pds = undefined
      const response = await api.post('/api/accounts', payload(account))

      expect(response.status).toEqual(400)
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
    it('sets status created if succesful', async () => {
      const response = await api.post('/api/accounts', payload(account))

      expect(response.status).toEqual(201)
    })
    it('returns the new account id if succesful', async () => {
      const response = await api.post('/api/accounts', payload(account))

      expect(response.body.data).toEqual({ id: expect.any(String) })
    })
    it('returns a 500 error if service borks', async () => {
      const error = new Error('b0rk')
      connection.query.mockRejectedValue(error)
      const response = await api.post('/api/accounts', payload(account))

      expect(response.status).toEqual(500)
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
  })
  describe('GET: /:id', () => {
    let accountId, account
    beforeEach(() => {
      accountId = 'abc-123'
      account = {
        id: accountId,
        public_key: 'key',
        pds_provider: 'dropbox',
        pds_credentials: Buffer.from('token').toString('base64')
      }
      connection.query.mockResolvedValue({ rows: [account] })
    })
    it('sets status 404 if account was not found', async () => {
      connection.query.mockResolvedValue({ rows: [] })
      const response = await api.get(`/api/accounts/${accountId}`)

      expect(response.status).toEqual(404)
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
    it('sets status 200 if account was found', async () => {
      const response = await api.get(`/api/accounts/${accountId}`)
      expect(response.status).toEqual(200)
    })
    it('returns account if it was found', async () => {
      const response = await api.get(`/api/accounts/${accountId}`)
      expect(response.body).toEqual({
        data: {
          id: accountId,
          publicKey: 'key',
          pds: {
            provider: 'dropbox'
          }
        },
        links: {
          self: '/api/accounts/abc-123'
        }
      })
    })
    it('returns a 500 if service borks', async () => {
      connection.query.mockRejectedValue(new Error('b0rk'))
      const response = await api.get(`/api/accounts/${accountId}`)

      expect(response.status).toEqual(500)
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
  })
})
