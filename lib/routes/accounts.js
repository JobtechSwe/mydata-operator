const { Router } = require('express')
const { create, login, setPdsProvider } = require('../services/accounts')
const { camelCase } = require('changecase-objects')
const createError = require('http-errors')
const dropbox = require('../adapters/pds/dropbox')
const { requireSession } = require('../middlewares/auth')
const { createToken } = require('../services/jwt')

const router = Router()

// Login
router.get('/login', ({ query, session }, res, next) => {
  if (query.redirect_uri) {
    session.requestingService = camelCase(query)
  }
  res.render('login', {})
})
router.post('/login', async ({ body: { username, password }, session }, res, next) => {
  let account
  try {
    account = await login(username, password)
  } catch (err) {
    return res.status(401).render('login', { error: 'Wrong username or password' })
  }
  try {
    session.account = account

    if (!account.pdsProvider) {
      res.redirect('/settings')
    } else if (session.requestingService) {
      res.redirect('/authorize')
    } else {
      res.redirect('/')
    }
  } catch (err) {
    next(createError(err))
  }
})

// Settings
router.get('/settings', requireSession, (req, res, next) => {
  const providers = [
    dropbox.description
  ]
  res.render('settings', { providers })
})
router.get('/settings/dropbox/callback', requireSession, async ({ query: { code }, session }, res, next) => {
  try {
    const credentials = await dropbox.authorize(code)
    session.account = await setPdsProvider(session.account, 'dropbox', credentials)
    if (session.requestingService) {
      res.redirect('/authorize')
    } else {
      res.redirect('/')
    }
  } catch (err) {
    next(err)
  }
})

// Authorize
router.get('/authorize', requireSession, (req, res, next) => {
  try {
    const token = createToken(req.session.account)
    res.redirect(`${req.session.requestingService.redirectUri}?access_token=${token}`)
    // res.render('authorize', {})
  } catch (err) {
    next(err)
  }
})
router.post('/authorize', requireSession, (req, res, next) => {
  //
})

// Logout
router.get('/logout', ({ session }, res, next) => {
  session.destroy(err => {
    if (err) {
      next(err)
    } else {
      res.redirect('/')
    }
  })
})

module.exports = router
