const express = require('express')
const router = express.Router()
const { logger } = require('../helpers/logger.helpers')
const k8s = require('@kubernetes/client-node')
const request = require('request')
const yaml = require('js-yaml')
const stringHelpers = require('../helpers/string.helpers')
const fs = require('fs')
const { packageConstants } = require('../constants')
const { default: axios } = require('axios')

router.get('/packages', async (req, res, next) => {
  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()

    const opts = {}
    kc.applyToRequest(opts)

    // PROVIDERS        /apis/pkg.crossplane.io/v1/providers
    // CONFIGURATIONS   /apis/pkg.crossplane.io/v1/configurations

    const list = [
      { key: 'packages', api: '/apis/pkg.crossplane.io/v1/providers' },
      {
        key: 'configurations',
        api: '/apis/pkg.crossplane.io/v1/configurations'
      }
    ]

    const response = {
      items: []
    }

    await Promise.all(
      list.map(async (r) => {
        const data = await new Promise((resolve, reject) => {
          request(
            encodeURI(`${kc.getCurrentCluster().server}/${r.api}`),
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
            response.items = await Promise.all(
              payload.items.map(async (x) => {
                const info = {
                  kind: x.kind,
                  icon: packageConstants.icon,
                  name: x.metadata.name,
                  metadata: []
                }
                const url = x.metadata.annotations['metaUrl']
                if (url) {
                  const resp = await axios.get(url)
                  const content = yaml.load(resp.data)
                  info.description =
                    content.metadata.annotations[
                      'meta.crossplane.io/description'
                    ]
                  if (
                    content.metadata.annotations['meta.crossplane.io/iconURI']
                  ) {
                    info.icon =
                      content.metadata.annotations['meta.crossplane.io/iconURI']
                  }

                  const annotations = [
                    'meta.crossplane.io/maintainer',
                    'meta.crossplane.io/license',
                    'meta.crossplane.io/source'
                  ]

                  annotations.forEach((key) => {
                    if (content.metadata.annotations[key]) {
                      info.metadata.push({
                        label: key.replace('meta.crossplane.io/', ''),
                        value: content.metadata.annotations[key]
                      })
                    }
                  })
                }
                return info
              })
            )

            // .map((x) => {
            //   const data = {
            //     kind: x.kind,
            //     icon: packageConstants.icon,
            //     name: x.metadata.name
            //   }

            //   const url = x.metadata.annotations['metaUrl']
            //   if (url) {
            //     //call
            //     // packageConstants.icon
            //   }
            //   // .map((x) => {
            //   //   return {
            //   //     kind: x.kind,
            //   //     apiVersion: x.apiVersion,
            //   //     name: x.metadata.name
            //   //   }
            //   // })
            //   return data
            // })
          }
        } catch (err) {
          logger.error(err)
        }
      })
    )

    logger.debug(JSON.stringify(response))

    res.status(200).json(response)
  } catch (error) {
    next(error)
  }
})

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
