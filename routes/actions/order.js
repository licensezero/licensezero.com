var readProduct = require('../../data/read-product')
var runParallel = require('run-parallel')
var writeOrder = require('../../data/write-order')

exports.properties = {
  licensee: require('./common/name'),
  jurisdiction: require('./common/jurisdiction'),
  products: {
    type: 'array',
    minItems: 1,
    // TODO: Revisit buy products limit
    maxItems: 100,
    items: require('./common/product-id')
  },
  tier: require('./common/tier')
}

exports.handler = function (body, service, end, fail, lock) {
  var products = body.products
  var tier = body.tier
  runParallel(
    products.map(function (productID, index) {
      return function (done) {
        readProduct(service, productID, function (error, product) {
          if (error) {
            if (error.userMessage) {
              error.userMessage += ': ' + productID
            }
            done(error)
          }
          products[index] = product
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
            retracted.map(productIDOf).join(', ')
          )
        }
        var noTier = products.filter(function (product) {
          return !product.pricing.hasOwnProperty(tier)
        })
        if (noTier.length !== 0) {
          return fail(
            'not available for tier: ' +
            noTier.map(productIDOf).join(', ')
          )
        }
        var pricedProducts = products.map(function (product) {
          product.price = product.pricing[tier]
          delete product.pricing
          return product
        })
        writeOrder(
          service, pricedProducts, tier,
          body.licensee, body.jurisdiction,
          function (error, orderID) {
            if (error) return fail('internal error')
            else end({location: '/pay/' + orderID})
          }
        )
      }
    }
  )
}

function productIDOf (argument) {
  return argument.productID
}
