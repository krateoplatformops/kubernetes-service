const express = require('express')
const router = express.Router()
const { logger } = require('../helpers/logger.helpers')
const k8s = require('@kubernetes/client-node')
const request = require('request')
const yaml = require('js-yaml')
const stringHelpers = require('../helpers/string.helpers')
const fs = require('fs')

router.get('/:selector', async (req, res, next) => {
  try {
    const selector = stringHelpers.b64toAscii(req.params.selector)
    logger.info(selector)

    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()

    const opts = {}
    kc.applyToRequest(opts)

    // load resources json file
    const resJson = fs.readFileSync('resources.json')
    let endpoints = JSON.parse(resJson).resources
    // load crd json file
    try {
      const crdJson = fs.readFileSync('crd.json')
      endpoints = endpoints.concat(JSON.parse(crdJson).resources)
    } catch (err) {
      logger.error(err)
    }

    logger.debug(JSON.stringify(endpoints))

    const response = {
      resources: []
    }

    await Promise.all(
      endpoints.map(async (r) => {
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

        try {
          const payload = yaml.load(data)
          if (payload.items && payload.items.length > 0) {
            response.resources.push({
              kind: r.kind,
              icon: r.icon,
              items: payload.items
            })
          }
        } catch (err) {
          logger.error(err)
        }
      })
    )

    response.resources = response.resources.sort((a, b) => {
      if (a.kind < b.kind) return -1
      if (a.kind > b.kind) return 1
      return 0
    })

    logger.debug(JSON.stringify(response))

    res.status(200).json(response)
  } catch (error) {
    next(error)
  }
})

module.exports = router
