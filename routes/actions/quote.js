var UUIDV4 = require('../../data/uuidv4-pattern')
var readProduct = require('../../data/read-product')
var runParallel = require('run-parallel')

exports.schema = {
  properties: {
    products: {
      type: 'array',
      minItems: 1,
      // TODO: Revisit quote products limit
      maxItems: 100,
      items: {
        description: 'product id',
        type: 'string',
        pattern: UUIDV4
      }
    }
  }
}

exports.handler = function (body, service, end, fail, lock) {
  var products = body.products
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
          } else {
            results[index] = data
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
