const { create } = require('../../../lib/services/consents')
const redis = require('../../../lib/adapters/redis')
const pg = require('../../../__mocks__/pg')
const axios = require('axios')
const jwtService = require('../../../lib/services/jwt')
jest.mock('../../../lib/services/jwt')
jest.mock('../../../lib/adapters/redis')
jest.mock('axios')

const base64 = (txt) => Buffer.from(txt, 'utf8').toString('base64')

describe('services/consents #create', () => {
  let consentBody
  beforeEach(() => {
    redis.set.mockResolvedValue('OK')
    jwtService.createToken.mockReturnValue('eyJhbGciOiJIUzI1NiIsIn...')
  })
  afterEach(() => {
    pg.clearMocks()
    pg.restoreDefaults()
  })

  beforeEach(() => {
    consentBody = {
      consentRequestId: '809eea87-6182-4cb4-8d6e-df6d411149a2',
      consentEncryptionKeyId: 'http://localhost:4000/jwks/enc_20190115082310',
      consentEncryptionKey: base64('-----BEGIN RSA PUBLIC KEY----- consent'),
      accountId: 'b60c5a93-ed93-41bd-8f77-176c564fb976',
      accountKey: base64('-----BEGIN RSA PUBLIC KEY----- account'),
      clientId: 'cv.work',
      scope: [
        {
          // clientEncryptionDocumentKey: 'YXNkYXNkYXNkc3VpYWhzZGl1YWhzZGl1YXNoZGl1YXNkPg==',
          domain: 'http://cv.com',
          area: 'education',
          description: 'Stuff',
          lawfulBasis: 'strength',
          permissions: ['READ'],
          purpose: 'dominance'
        }
      ]
    }
  })
  it('fails if input is invalid', async () => {
    await expect(create({ blaj: 'asdasd' })).rejects.toThrow()
  })
  it('inserts consent into db', async () => {
    await create(consentBody)

    let calls = 1

    // Transaction begin
    expect(pg.client.query).toHaveBeenNthCalledWith(calls++, 'BEGIN')

    // Consent request
    expect(pg.client.query).toHaveBeenNthCalledWith(calls++,
      expect.stringMatching(/^INSERT INTO consent_requests/),
      [
        consentBody.consentRequestId,
        expect.any(String), // consentId
        consentBody.accountId,
        consentBody.clientId,
        JSON.stringify(consentBody)
      ])
    const consentId = pg.client.query.mock.calls[1][1][1]

    // Scope
    expect(pg.client.query).toHaveBeenNthCalledWith(calls++,
      expect.stringMatching(/^INSERT INTO scope/),
      [
        expect.any(String), // scope id
        consentId, // consentId
        'http://cv.com',
        'education',
        'Stuff',
        'dominance',
        'strength',
        true,
        false
      ])
    const scopeId = pg.client.query.mock.calls[2][1][0]

    // Encryption keys
    expect(pg.client.query).toHaveBeenNthCalledWith(calls++,
      expect.stringMatching(/^INSERT INTO encryption_keys/),
      [
        'http://localhost:4000/jwks/enc_20190115082310',
        '-----BEGIN RSA PUBLIC KEY----- consent'
      ])
    expect(pg.client.query).toHaveBeenNthCalledWith(calls++,
      expect.stringMatching(/^INSERT INTO scope_keys/),
      [
        scopeId,
        'http://localhost:4000/jwks/enc_20190115082310'
      ])

    // Transaction commit
    expect(pg.client.query).toHaveBeenNthCalledWith(calls, 'COMMIT')
    expect(pg.client.query).toHaveBeenCalledTimes(calls)
    expect(pg.client.end).toBeCalledTimes(1)
  })
  it('posts the right stuff to the client', async () => {
    await create(consentBody)

    expect(axios.post).toBeCalledWith('http://cv.work/events', {
      type: 'CONSENT_APPROVED',
      payload: {
        consentId: expect.any(String),
        accessToken: expect.any(String),
        consentRequestId: '809eea87-6182-4cb4-8d6e-df6d411149a2',
        consentEncryptionKeyId: 'http://localhost:4000/jwks/enc_20190115082310',
        scope: [
          {
            // clientEncryptionDocumentKey: 'YXNkYXNkYXNkc3VpYWhzZGl1YWhzZGl1YXNoZGl1YXNkPg==',
            domain: 'http://cv.com',
            area: 'education',
            description: 'Stuff',
            lawfulBasis: 'strength',
            permissions: ['READ'],
            purpose: 'dominance'
          }
        ],
        accountKey: base64('-----BEGIN RSA PUBLIC KEY----- account')
      }
    })
  })
})
