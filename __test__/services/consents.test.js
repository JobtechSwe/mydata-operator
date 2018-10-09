const { request, get } = require('../../lib/services/consents')

describe('services/consents', () => {
  describe('#request', () => {
    it('fails if the input is invalid', async () => {
      await expect(request({})).rejects.toThrow()
    })
    it('fubars', async () => {
      try {
        const result = await request({})
      } catch (err) {
        console.log(err.name)
      }
      expect().toEqual()
    })
  })
})