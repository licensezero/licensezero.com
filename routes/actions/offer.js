var UUIDV4 = require('../../data/uuidv4-pattern')
var checkRepository = require('./check-repository')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var productPath = require('../../paths/product')
var productsListPath = require('../../paths/products-list')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var stringifyProducts = require('../../data/stringify-products')
var uuid = require('uuid/v4')

var priceSchema = {
  description: 'price per license, in United States cents',
  type: 'integer',
  min: 50, // 50 cents
  max: 100000 // 1,000 dollars
}

var TIER_NAMES = ['solo', 'team', 'company', 'enterprise']

var pricingSchema = {
  description: 'private license pricing',
  type: 'object',
  properties: {},
  required: [],
  additionalProperties: false
}
TIER_NAMES.forEach(function (tier) {
  pricingSchema.properties[tier] = priceSchema
  pricingSchema.required.push(tier)
})

var properties = {
  id: {
    description: 'licensor id',
    type: 'string',
    pattern: UUIDV4
  },
  password: {
    type: 'string'
  },
  repository: {
    description: 'source code repository',
    type: 'string',
    format: 'uri',
    pattern: '^(https|http)://'
  },
  pricing: pricingSchema,
  grace: {
    description: 'number of calendar days grace period',
    type: 'integer',
    min: 7, // one week
    max: 365 // one year
  },
  terms: {
    type: 'string',
    const: 'I agree with the latest public terms of service.'
  }
}

exports.schema = {
  type: 'object',
  properties: properties,
  additionalProperties: false,
  required: Object.keys(properties)
}

exports.handler = function (body, service, end, fail, lock) {
  var id = body.id
  var product = uuid()
  lock([body.id], function (release) {
    runSeries([
      checkRepository.bind(null, body),
      function writeFile (done) {
        runParallel([
          function writeProductFile (done) {
            var file = productPath(service, product)
            runSeries([
              mkdirp.bind(null, path.dirname(file)),
              fs.writeFile.bind(fs, file, JSON.stringify({
                id: product,
                licensor: id,
                pricing: body.pricing,
                grace: body.grace,
                repository: body.repository
              }))
            ], done)
          },
          function appendToLicensorProductsList (done) {
            var file = productsListPath(service, id)
            var content = stringifyProducts([
              {
                product: product,
                offered: new Date().toISOString(),
                retracted: null
              }
            ])
            runSeries([
              mkdirp.bind(null, path.dirname(file)),
              fs.appendFile.bind(fs, file, content)
            ], done)
          }
        ], done)
      }
    ], release(function (error) {
      /* istanbul ignore if */
      if (error) {
        service.log.error(error)
        /* istanbul ignore else */
        if (error.userMessage) {
          fail(error.userMessage)
        } else {
          fail('internal error')
        }
      } else {
        end({product: product})
      }
    }))
  })
}
