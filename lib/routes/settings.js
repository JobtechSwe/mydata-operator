const { Router } = require('express')

const router = Router()

router.get('/', (req, res, next) => {
  // these are dev credentials
  // todo: read these from config/environment
  const dropboxCallbackURI = 'http://localhost:3000/pds/dropbox/callback'
  const dropboxMyDataClientId = 'tsw50ay5z1j0k0k'
  const providers = [
    {
      displayName: 'Dropbox',
      value: 'dropbox',
      imageSrc: '/images/icons8-dropbox-50.png',
      link: `https://dropbox.com/oauth2/authorize?response_type=code&client_id=${dropboxMyDataClientId}&redirect_uri=${dropboxCallbackURI}`
    }
  ]
  res.render('settings', { operatorName: 'Smooth Operator', providers })
})

module.exports = router
