const { create } = require('../../../lib/services/consents')
const redis = require('../../../lib/adapters/redis')
const postgres = require('../../../lib/adapters/postgres')
const axios = require('axios')
jest.mock('../../../lib/adapters/redis')
jest.mock('../../../lib/adapters/postgres')
jest.mock('axios')

const base64 = (txt) => Buffer.from(txt, 'utf8').toString('base64')

describe('services/consents #create', () => {
  let connection, consentBody
  beforeEach(() => {
    redis.set.mockResolvedValue('OK')
    connection = {
      query: jest.fn().mockResolvedValue({ rows: [{}] }),
      end: jest.fn().mockResolvedValue()
    }
    postgres.connect.mockResolvedValue(connection)
  })

  beforeEach(() => {
    consentBody = {
      consentRequestId: '809eea87-6182-4cb4-8d6e-df6d411149a2',
      consentEncryptionKey: base64('-----BEGIN RSA PUBLIC KEY----- consent'),
      accountId: 'b60c5a93-ed93-41bd-8f77-176c564fb976',
      publicKey: base64('-----BEGIN RSA PUBLIC KEY----- account'),
      clientId: 'cv.work',
      scope: [
        {
          // clientEncryptionDocumentKey: 'YXNkYXNkYXNkc3VpYWhzZGl1YWhzZGl1YXNoZGl1YXNkPg==',
          domain: 'http://cv.com',
          area: 'education',
          description: 'Stuff',
          lawfulBasis: 'strength',
          permissions: ['read'],
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
    expect(postgres.connect).toHaveBeenCalledTimes(1)
    expect(connection.query).toHaveBeenCalledTimes(1)
    expect(connection.query).toBeCalledWith(
      expect.any(String),
      [
        consentBody.consentId,
        consentBody.accountId,
        'cv.work',
        JSON.stringify(consentBody.scope)
      ])
    expect(connection.end).toBeCalledTimes(1)
  })

  it('posts the right stuff to the client', async () => {
    await create(consentBody)

    expect(axios.post).toBeCalledWith('http://cv.work/events', {
      type: 'CONSENT_APPROVED',
      payload: {
        consentRequestId: '809eea87-6182-4cb4-8d6e-df6d411149a2',
        scope: [
          {
            // clientEncryptionDocumentKey: 'YXNkYXNkYXNkc3VpYWhzZGl1YWhzZGl1YXNoZGl1YXNkPg==',
            domain: 'http://cv.com',
            area: 'education',
            description: 'Stuff',
            lawfulBasis: 'strength',
            permissions: ['read'],
            purpose: 'dominance'
          }
        ],
        publicKey: base64('-----BEGIN RSA PUBLIC KEY----- account')
      }
    })
  })
})