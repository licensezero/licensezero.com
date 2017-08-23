var JURISDICTIONS = require('../../data/jurisdictions')
var TIERS = require('../../data/private-license-tiers')
var UUIDV4 = require('../../data/uuidv4-pattern')
var buyPath = require('../../paths/buy')
var ecb = require('ecb')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var readProduct = require('../../data/read-product')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var uuid = require('uuid/v4')

exports.schema = {
  properties: {
    licensee: {
      description: 'your legal name',
      type: 'string',
      minLength: 4
    },
    jurisdiction: {
      description: 'legal jurisdiction where you reside',
      type: 'string',
      enum: JURISDICTIONS
    },
    products: {
      type: 'array',
      minItems: 1,
      // TODO: Revisit buy products limit
      maxItems: 100,
      items: {
        description: 'product id',
        type: 'string',
        pattern: UUIDV4
      }
    },
    tier: {
      type: 'string',
      enum: Object.keys(TIERS)
    }
  }
}

exports.handler = function (body, service, end, fail, lock) {
  var products = body.products
  var tier = body.tier
  var results = new Array(products.length)
  runParallel(
    products.map(function (product, index) {
      return function (done) {
        readProduct(service, product, function (error, data) {
          if (error) {
            if (error.userMessage) {
              error.userMessage += ': ' + product
            }
            done(error)
          }
          results[index] = data
          done()
        })
      }
    }),
    function (error) {
      if (error) {
        /* istanbul ignore else */
        if (error.userMessage) {
          fail(error.userMessage)
        } else {
          service.log.error(error)
          fail('internal error')
        }
      } else {
        var retracted = results.filter(function (result) {
          return result.retracted
        })
        if (retracted.length !== 0) {
          return fail(
            'retracted products: ' +
            retracted
              .map(function (retracted) {
                return retracted.product
              })
              .join(', ')
          )
        }
        var noTier = results.filter(function (result) {
          return skuForTier(result, tier) === undefined
        })
        if (noTier.length !== 0) {
          return fail(
            'not available for tier: ' +
            noTier
              .map(function (result) {
                return result.product
              })
              .join(', ')
          )
        }
        var buy = uuid()
        var stripeOrder
        var file = buyPath(service, buy)
        runSeries([
          function createStripeOrder (done) {
            service.stripe.api.orders.create({
              currency: 'usd',
              items: results.map(function (result) {
                return {
                  type: 'sku',
                  parent: skuForTier(result, tier).id,
                  quantity: 1
                }
              }),
              metadata: {
                licensee: body.licensee,
                jurisdiction: body.jurisdiction,
                date: new Date().toISOString()
              }
            }, ecb(done, function (response) {
              stripeOrder = response.id
              done()
            }))
          },
          mkdirp.bind(null, path.dirname(file)),
          fs.writeFile.bind(fs, file, JSON.stringify(stripeOrder))
        ], function (error) {
          /* istanbul ignore if */
          if (error) {
            fail('internal error')
          } else {
            end({location: '/buy/' + buy})
          }
        })
      }
    }
  )
}

function skuForTier (result, tier) {
  return result.stripe.skus.data.find(function (sku) {
    return sku.metadata.tier === tier
  })
}
