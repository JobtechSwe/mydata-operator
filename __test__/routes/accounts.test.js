const request = require('supertest')
const { EventEmitter } = require('events')
const app = require('../../lib/app')
const accountService = require('../../lib/services/accounts')
const consentService = require('../../lib/services/consents')
jest.mock('../../lib/services/accounts')
jest.mock('../../lib/services/consents')

describe('routes/accounts', () => {
  describe('POST: /', () => {
    let account, accountResponse
    beforeEach(() => {
      account = {
        id: 'einar'
      }
      accountResponse = {
        data: account,
        links: {
          self: '/accounts/einar'
        }
      }
    })
    it('calls accountService.create()', async () => {
      accountService.create.mockResolvedValue(account)
      await request(app)
        .post('/accounts')
        .set({ 'Content-Type': 'application/json' })
        .accept('application/json')
        .send(account)

      expect(accountService.create).toHaveBeenCalledWith(account)
    })
    it('returns a 400 error if payload is bad', async () => {
      const error = Object.assign(new Error('Bad request'), { name: 'ValidationError' })
      accountService.create.mockRejectedValue(error)
      const response = await request(app)
        .post('/accounts')
        .set({ 'Content-Type': 'application/json' })
        .accept('application/json')
        .send(account)

      expect(response.status).toEqual(400)
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
    it('sets status created if succesful', async () => {
      accountService.create.mockResolvedValue(account)
      const response = await request(app)
        .post('/accounts')
        .set({ 'Content-Type': 'application/json' })
        .accept('application/json')
        .send(account)

      expect(response.status).toEqual(201)
    })
    it('returns the new account if succesful', async () => {
      accountService.create.mockResolvedValue(account)
      const response = await request(app)
        .post('/accounts')
        .set({ 'Content-Type': 'application/json' })
        .accept('application/json')
        .send(account)

      expect(response.body.data).toEqual(account)
    })
    it('returns the account url if succesful', async () => {
      accountService.create.mockResolvedValue(account)
      const response = await request(app)
        .post('/accounts')
        .set({ 'Content-Type': 'application/json' })
        .accept('application/json')
        .send(account)

      expect(response.body.links).toEqual({ self: '/accounts/einar' })
    })
    it('returns an encoded url', async () => {
      accountService.create.mockResolvedValue({ id: 'this+id/has-to--be/encoded' })
      const response = await request(app)
        .post('/accounts')
        .set({ 'Content-Type': 'application/json' })
        .accept('application/json')
        .send(account)

      expect(response.body.links).toEqual({ self: '/accounts/this%2Bid%2Fhas-to--be%2Fencoded' })
    })
    it('returns a 500 error if service borks', async () => {
      const error = new Error('b0rk')
      accountService.create.mockRejectedValue(error)
      const response = await request(app)
        .post('/accounts')
        .set({ 'Content-Type': 'application/json' })
        .accept('application/json')
        .send(account)

      expect(response.status).toEqual(500)
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
  })
  describe('GET: /:id', () => {
    let accountId, account, accountResponse
    beforeEach(() => {
      accountId = 'einar'
      account = {
        id: accountId
      }
      accountResponse = {
        data: account,
        links: {
          self: `/accounts/${accountId}`
        }
      }
    })
    it('calls accountService.get()', async () => {
      accountService.get.mockResolvedValue(account)
      await request(app).get(`/accounts/${accountId}`)

      expect(accountService.get).toHaveBeenCalledWith(accountId)
    })
    it('sets status 404 if account was not found', async () => {
      accountService.get.mockResolvedValue(undefined)
      const response = await request(app).get(`/accounts/${accountId}`)

      expect(response.status).toEqual(404)
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
    it('sets status 200 if account was found', async () => {
      accountService.get.mockResolvedValue(account)
      const response = await request(app).get(`/accounts/${accountId}`)

      expect(response.status).toEqual(200)
    })
    it('returns account if it was found', async () => {
      accountService.get.mockResolvedValue(account)
      const response = await request(app).get(`/accounts/${accountId}`)

      expect(response.body).toEqual(accountResponse)
    })
    it('returns a 500 if service borks', async () => {
      accountService.get.mockRejectedValue(new Error('b0rk'))
      const response = await request(app).get(`/accounts/${accountId}`)

      expect(response.status).toEqual(500)
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
  })
})
