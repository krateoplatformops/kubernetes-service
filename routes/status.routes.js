const express = require('express')
const router = express.Router()

router.get('/ping', (req, res) => {
  res.status(200).send('Kubernetes Service')
})

router.get('/healthz', (req, res) => {
  res.status(200).send('Kubernetes Service')
})

module.exports = router
