var UUIDV4 = require('../../data/uuidv4-pattern')
var fs = require('fs')
var mutateTextFile = require('../../data/mutate-text-file')
var parseJSON = require('json-parse-errback')
var parseProducts = require('../../data/parse-products')
var productPath = require('../../paths/product')
var productsListPath = require('../../paths/products-list')
var runParallel = require('run-parallel')
var runWaterfall = require('run-waterfall')
var stringifyProducts = require('../../data/stringify-products')

exports.schema = {
  type: 'object',
  properties: {
    id: {
      description: 'licensor id',
      type: 'string',
      pattern: UUIDV4
    },
    password: {
      type: 'string'
    },
    product: {
      description: 'product id',
      type: 'string',
      pattern: UUIDV4
    }
  },
  additionalProperties: false,
  required: ['id', 'password', 'product']
}

exports.handler = function (body, service, end, fail, lock) {
  var product = body.product
  var id = body.id
  lock([product, id], function (release) {
    runWaterfall([
      function (done) {
        var file = productPath(service, product)
        fs.readFile(file, function (error, buffer) {
          if (error && error.code === 'ENOENT') {
            error.userMessage = 'no such product'
          }
          done(error, buffer)
        })
      },
      parseJSON,
      function (productData, done) {
        runParallel([
          function removeFromProductsList (done) {
            var file = productsListPath(service, id)
            mutateTextFile(file, function (text) {
              return stringifyProducts(
                parseProducts(text)
                  .map(function (element) {
                    if (
                      element.product === product &&
                      element.retracted === null
                    ) {
                      element.retracted = new Date().toISOString()
                    }
                    return element
                  })
              )
            }, done)
          },
          function updateStripe (done) {
            var stripeData = productData.stripe
            var INACTIVE = {active: false}
            runParallel(
              Object.keys(productData.stripe.skus)
                .map(function (tierName) {
                  return function deactivateSKU (done) {
                    service.stripe.api.skus.update(
                      stripeData.skus[tierName], INACTIVE, done
                    )
                  }
                })
                .concat(
                  function deactivateProduct (done) {
                    service.stripe.api.products.update(
                      stripeData.product, INACTIVE, done
                    )
                  }
                ),
              done
            )
          }
        ], done)
      }
    ], release(function (error) {
      if (error) {
        service.log.error(error)
        /* istanbul ignore else */
        if (error.userMessage) {
          fail(error.userMessage)
        } else {
          fail('internal error')
        }
      } else {
        end()
      }
    }))
  })
}
