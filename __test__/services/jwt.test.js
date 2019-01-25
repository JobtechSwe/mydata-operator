const { createToken } = require(`${process.cwd()}/lib/services/jwt`)

describe('services/auth', () => {
  describe('#createToken', () => {
    let account
    beforeEach(() => {
      account = {
        id: '12345',
        username: 'johan',
        pdsProvider: 'dropbox',
        pdsCredentials: Buffer.from('dfsgdfdfg').toString('base64')
      }
    })
    it('creates a token containing account info', () => {
      let content = createToken(account).split('.')[1]
      content = JSON.parse(Buffer.from(content, 'base64').toString('utf8'))
      expect(content.account).toEqual(account)
    })
  })
})
