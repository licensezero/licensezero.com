var readProduct = require('../../data/read-product')
var runParallel = require('run-parallel')
var sanitizeProduct = require('../../data/sanitize-product')

exports.properties = {
  products: {
    type: 'array',
    minItems: 1,
    // TODO: Revisit quote products limit
    maxItems: 100,
    items: require('./common/product-id')
  }
}

exports.handler = function (body, service, end, fail, lock) {
  var products = body.products
  var results = new Array(products.length)
  runParallel(
    products.map(function (productID, index) {
      return function (done) {
        readProduct(service, productID, function (error, product) {
          if (error) {
            if (error.userMessage) {
              error.userMessage += ': ' + productID
            }
            done(error)
          } else {
            sanitizeProduct(product)
            results[index] = product
            done()
          }
        })
      }
    }),
    function (error) {
      if (error) {
        /* istanbul ignore else */
        if (error.userMessage) {
          fail(error.userMessage)
        } else {
          fail('internal error')
        }
      } else {
        end({products: results})
      }
    }
  )
}
