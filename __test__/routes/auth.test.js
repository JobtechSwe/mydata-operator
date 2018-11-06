const request = require('supertest')
const app = require('../../lib/app')
const accountService = require('../../lib/services/accounts')
jest.mock('../../lib/services/accounts')

describe('auth', () => {
  describe('POST: /', () => {
    it('calls accountService.login()', async () => {
      const account = {
        id: 'abc-123',
        username: 'johan'
      }
      accountService.login.mockResolvedValue(account)

      await request(app)
        .post('/auth')
        .set({ 'Content-Type': 'application/json' })
        .accept('application/json')
        .send({ username: 'johan', password: 'pwd' })

      expect(accountService.login).toHaveBeenCalledWith('johan', 'pwd')
    })
    it('returns a jwt', async () => {
      const account = {
        id: 'abc-123',
        username: 'johan'
      }
      accountService.login.mockResolvedValue(account)

      const response = await request(app)
        .post('/auth')
        .set({ 'Content-Type': 'application/json' })
        .accept('application/json')
        .send({ username: 'johan', password: 'pwd' })

      expect(response.body).toEqual(expect.any(Object))
      expect(response.body.token).toEqual(expect.any(String))

      const token = JSON.parse(Buffer.from(response.body.token.split('.')[1], 'base64').toString('utf8'))
      expect(token.account).toEqual(account)
    })
  })
})
