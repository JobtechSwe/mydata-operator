const { Router } = require('express')
const axios = require('axios')

const router = Router()

router.get('/dropbox/callback', async (req, res, next) => {
  try {
    const oauthCode = req.query.code
    // todo: read these from config/environment
    const dropboxCallbackURI = 'http://localhost:3000/pds/dropbox/callback'
    const dropboxApiURL = 'https://api.dropbox.com'
    const dropboxOauthTokenUrl = '/oauth2/token'
    const dropboxMyDataClientId = 'tsw50ay5z1j0k0k'
    const dropboxMyDataClientSecret = '0ke4iy96y7amb3g'

    const response = await axios.post(`${dropboxApiURL}${dropboxOauthTokenUrl}`, {
      code: oauthCode,
      grant_type: 'authorization_code',
      client_id: dropboxMyDataClientId,
      client_secret: dropboxMyDataClientSecret,
      redirect_uri: dropboxCallbackURI // dropbox only compares this to the one used to get the code
    })
    // todo: fix. this returns 400 "No auth function available for given request"
    debugger

    // todo: save in db
    if (response) {
      console.log('all is right with the world')
    }

    res.send()
  } catch (err) {
    debugger
    // todo: on axios error it returns an object with a circular structure which breaks the error handling :p
    next(err)
  }
})

module.exports = router
