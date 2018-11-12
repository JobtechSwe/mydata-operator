const { createToken } = require(`${process.cwd()}/lib/services/jwt`)

describe('services/auth', () => {
  describe('#createToken', () => {
    let account
    beforeEach(() => {
      account = {
        id: '12345',
        username: 'johan',
        pdsProvider: 'dropbox',
        pdsCredentials: {abc:123}
      }
    })
    it('creates a token containing account info, excluding pdsCredentials', () => {
      let [alg, content, sign] = createToken(account).split('.')
      content = JSON.parse(Buffer.from(content, 'base64').toString('utf8'))
      const {id, username, pdsProvider} = account
      expect(content.account).toEqual({ id, username, pdsProvider })
    })
  })
})
