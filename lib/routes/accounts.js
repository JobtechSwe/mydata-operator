const { Router } = require('express')
const router = Router()

// Create account
router.post('/', (req, res, next) => {
  res.send()
})

// Get account
router.get('/:account_id', (req, res, next) => {
  res.send()
})

// Get attached devices
router.get('/:account_id/devices', (req, res, next) => {
  res.send()
})

// Attach device
router.post('/:account_id/devices', (req, res, next) => {
  res.send()
})

// Get attached device
router.get('/:account_id/devices/:device_id', (req, res, next) => {
  res.send()
})

// Detach device
router.delete('/:account_id/devices/:device_id', (req, res, next) => {
  res.send()
})

module.exports = router
