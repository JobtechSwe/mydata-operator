const { createServer } = require('http')
const EventSource = require('eventsource')
const axios = require('axios')
const app = require(`${process.cwd()}/lib/app`)

const port = 1729 // Because Ramanujan
const host = `http://localhost:${port}`

function log(...args) {
  args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).forEach(t => process.stdout.write(t))
  process.stdout.write('\n')
}

const consentrequest = () => ({
  account_id: 'ramanujan',
  client_id: 'dfgdfgdfgg',
  scope: ['read'],
  description: 'DO IT!'
})

describe('Integration: routes/accounts', () => {
  let server, eventsource
  beforeAll(async () => {
    server = createServer(app)
    await new Promise((resolve, reject) => server.listen(port, (err) => err ? reject(err) : resolve()))
    await axios.post(`${host}/accounts`, { id: 'ramanujan' })
  })
  afterAll /* you're my wonder wall */(async () => {
    await axios.delete(`${host}/accounts/ramanujan`)
    server.close()
  })
  describe('subscribing to consents', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test'
      eventsource = new EventSource(`${host}/accounts/ramanujan/consents`)
      eventsource.addEventListener('error', err => log(err))
    })
    afterEach(() => {
      if (eventsource) {
        eventsource.close()
      }
    })
    it('recieves an update when a consent request is created', (done) => {
      const cr = consentrequest()
      eventsource.addEventListener('consent', ({ data }) => {
        expect(JSON.parse(data)).toMatchObject(cr)
        done()
      })
      axios.post(`${host}/consents`, cr)
    })
  })
})
