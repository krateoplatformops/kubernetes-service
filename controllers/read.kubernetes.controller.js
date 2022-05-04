const express = require('express')
const router = express.Router()
const { logger } = require('../helpers/logger.helpers')
const k8s = require('@kubernetes/client-node')
const request = require('request')
const yaml = require('js-yaml')
const { k8sConstants } = require('../constants')
const stringHelpers = require('../helpers/string.helpers')

router.get('/:selector', async (req, res, next) => {
  try {
    const selector = stringHelpers.b64toAscii(req.params.selector)
    logger.info(selector)

    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()

    const opts = {}
    kc.applyToRequest(opts)

    const response = {}

    await Promise.all(
      k8sConstants.resources.map(async (r) => {
        const data = await new Promise((resolve, reject) => {
          request(
            encodeURI(
              `${kc.getCurrentCluster().server}/${
                r.api
              }?labelSelector=${selector}`
            ),
            opts,
            (error, response, data) => {
              if (error) reject(error)
              else resolve(data)
            }
          )
        })
        const payload = yaml.load(data)

        try {
          if (payload.items && payload.items.length > 0) {
            response[r.kind] = payload.items
          }
        } catch (err) {
          logger.error(err)
        }
      })
    )

    res.status(200).json(response)
  } catch (error) {
    next(error)
  }
})

module.exports = router
