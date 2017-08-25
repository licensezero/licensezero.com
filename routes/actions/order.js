var JURISDICTIONS = require('../../data/jurisdictions')
var TIERS = require('../../data/private-license-tiers')
var UUIDV4 = require('../../data/uuidv4-pattern')
var fs = require('fs')
var mkdirp = require('mkdirp')
var orderPath = require('../../paths/order')
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
          products[index] = data
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
        var retracted = products.filter(function (product) {
          return product.retracted
        })
        if (retracted.length !== 0) {
          return fail(
            'retracted products: ' +
            retracted.map(idOf).join(', ')
          )
        }
        var noTier = products.filter(function (product) {
          return !product.pricing.hasOwnProperty(tier)
        })
        if (noTier.length !== 0) {
          return fail(
            'not available for tier: ' +
            noTier.map(idOf).join(', ')
          )
        }
        var orderID = uuid()
        var file = orderPath(service, orderID)
        var pricedProducts = products.map(function (product) {
          product.price = product.pricing[tier]
          // TODO: Calculate tax
          product.tax = 0
          product.total = product.price + product.tax
          delete product.pricing
          return product
        })
        var subtotal = products.reduce(function (subtotal, product) {
          return subtotal + product.price
        }, 0)
        var tax = products.reduce(function (tax, product) {
          return tax + product.tax
        }, 0)
        runSeries([
          mkdirp.bind(null, path.dirname(file)),
          fs.writeFile.bind(fs, file, JSON.stringify({
            id: orderID,
            tier: tier,
            jurisdiction: body.jurisdiction,
            licensee: body.licensee,
            products: pricedProducts,
            subtotal: subtotal,
            tax: tax,
            total: subtotal + tax
          }))
        ], function (error) {
          /* istanbul ignore if */
          if (error) {
            console.error(error)
            fail('internal error')
          } else {
            end({location: '/pay/' + orderID})
          }
        })
      }
    }
  )
}

function idOf (argument) {
  return argument.id
}
