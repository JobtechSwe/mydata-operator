const { createServer } = require('http')
const EventSource = require('eventsource')
const axios = require('axios')
const app = require(`${process.cwd()}/lib/app`)

const port = 1729 // Because Ramanujan
const host = `http://localhost:${port}/api`

const consentrequest = () => ({
  account_id: 'ramanujan',
  client_id: 'dfgdfgdfgg',
  scope: ['read'],
  description: 'DO IT!'
})
describe('Integration: routes /api/accounts', () => {
  let server, eventsource
  beforeAll(async () => {
    server = createServer(app)
    await new Promise((resolve, reject) => server.listen(port, (err) => err ? reject(err) : resolve()))
    // await axios.post(`${host}/accounts`, { id: 'ramanujan' })
  })
  afterAll(async () => {
    await axios.delete(`${host}/accounts/ramanujan`)
    server.close()
  })
  describe('subscribing to consents', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test'
      // eventsource = new EventSource(`${host}/accounts/ramanujan/consents`)
    })
    afterEach(() => {
      if (eventsource) {
        eventsource.close()
      }
    })
    xit('recieves an update when a consent request is created', (done) => {
      const cr = consentrequest()
      eventsource.addEventListener('consent', ({ data }) => {
        expect(JSON.parse(data)).toMatchObject(cr)
        done()
      })
      axios.post(`${host}/consents`, cr)
    })
  })
})
