const express = require('express')
const router = express.Router()
const { logger } = require('../helpers/logger.helpers')
const k8s = require('@kubernetes/client-node')

router.get('/:namespace', async (req, res, next) => {
  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromCluster()

    logger.debug('k8s.KubeConfig loaded')
    logger.debug(req.query.namespace)

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

    const pods = await k8sApi.listNamespacedPod(req.params.namespace)
    res.status(200).json(pods.body)
  } catch (error) {
    next(error)
  }
})

module.exports = router
