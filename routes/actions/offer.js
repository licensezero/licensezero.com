var TIERS = require('../../data/private-license-tiers')
var UUIDV4 = require('../../data/uuidv4-pattern')
var checkRepository = require('./check-repository')
var ecb = require('ecb')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var pick = require('../../data/pick')
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

// TODO: Write all information into Stripe
// TODO: Fetch the product, parse SKUs, and paginate if necessary

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
  var stripeProduct
  var stripeSKUs = {}
  lock([body.id], function (release) {
    runSeries([
      checkRepository.bind(null, body),
      function createStripeObjects (done) {
        var now = new Date().toISOString()
        service.stripe.api.products.create({
          name: 'License Zero Product ' + product,
          description: (
            'private license for License Zero product ' + product
          ),
          attributes: ['tier', 'users'],
          shippable: false,
          metadata: {
            licensor: id,
            product: product,
            date: now
          }
        }, ecb(done, function (response) {
          stripeProduct = response.id
          runParallel(TIER_NAMES.map(function (tierName) {
            return function createSKU (done) {
              service.stripe.api.skus.create({
                product: stripeProduct,
                attributes: {
                  tier: tierName,
                  users: TIERS[tierName]
                },
                price: body.pricing[tierName],
                currency: 'usd',
                inventory: {type: 'infinite'},
                metadata: {
                  licensor: id,
                  product: product,
                  date: now
                }
              }, ecb(done, function (response) {
                stripeSKUs[tierName] = response.id
                done()
              }))
            }
          }), done)
        }))
      },
      function writeFile (done) {
        runParallel([
          function writeProductFile (done) {
            var file = productPath(service, product)
            var content = pick(body, ['id', 'repository', 'grace'])
            content.stripe = {
              product: stripeProduct,
              skus: stripeSKUs
            }
            runSeries([
              mkdirp.bind(null, path.dirname(file)),
              fs.writeFile.bind(fs, file, JSON.stringify(content))
            ], done)
          },
          function (done) {
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
          console.error(error)
          fail('internal error')
        }
      } else {
        end({product: product})
      }
    }))
  })
}
