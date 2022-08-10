const express = require('express')
const router = express.Router()
const { logger } = require('../helpers/logger.helpers')
const k8s = require('@kubernetes/client-node')
const request = require('request')
const yaml = require('js-yaml')
const stringHelpers = require('../helpers/string.helpers')
const fs = require('fs')

router.get('/:selector/:params?', async (req, res, next) => {
  try {
    const selector = req.params.selector
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
    // plugin params
    if (req.params.params) {
      const p = JSON.parse(stringHelpers.b64toAscii(req.params.params))
      p.forEach((x) => {
        if (!x.icon) {
          x.icon = 'crd'
        }
        if (!endpoints.find((y) => y.api === x.api)) {
          endpoints.push(x)
        } else {
          endpoints = endpoints.map((y) => (y.api === x.api ? x : y))
        }
      })
    }

    logger.debug(JSON.stringify(endpoints))

    const response = {
      list: []
    }

    await Promise.all(
      endpoints.map(async (r) => {
        const data = await new Promise((resolve, reject) => {
          logger.debug(
            encodeURI(
              `${kc.getCurrentCluster().server}/${
                r.api
              }?labelSelector=${selector}`
            )
          )
          request(
            encodeURI(
              `${kc.getCurrentCluster().server}/${
                r.api
              }?labelSelector=${selector}`
            ),
            opts,
            (error, response, data) => {
              try {
                if (response.statusCode != 200) {
                  logger.warn(
                    `Not found ${encodeURI(
                      `${kc.getCurrentCluster().server}/${
                        r.api
                      }?labelSelector=${selector}`
                    )}`
                  )
                }
              } catch {}

              if (error) {
                logger.error(error)
                reject(error)
              } else resolve(data)
            }
          )
        })

        try {
          const payload = yaml.load(data)
          if (payload.items && payload.items.length > 0) {
            response.list.push({
              kind: r.kind,
              icon: r.icon,
              items: payload.items
            })
          }
          try {
            if (payload.resources.length > 0) {
              logger.warn(
                `Multiple resources found ${encodeURI(
                  `${kc.getCurrentCluster().server}/${
                    r.api
                  }?labelSelector=${selector}`
                )}`
              )
            }
          } catch {}
        } catch (err) {
          logger.error(err)
        }
      })
    )

    response.list = response.list.sort((a, b) => {
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
