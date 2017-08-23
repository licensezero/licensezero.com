var UUIDV4 = require('../../data/uuidv4-pattern')
var mutateJSONFile = require('../../data/mutate-json-file')
var mutateTextFile = require('../../data/mutate-text-file')
var parseProducts = require('../../data/parse-products')
var productPath = require('../../paths/product')
var productsListPath = require('../../paths/products-list')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
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
  var stripeData
  lock([product, id], function (release) {
    runSeries([
      function (done) {
        var file = productPath(service, product)
        mutateJSONFile(file, function (data) {
          // TODO: Saving state from file here is a kludge.
          stripeData = data.stripe
          data.retracted = true
        }, function (error) {
          if (error && error.code === 'ENOENT') {
            error.userMessage = 'no such product'
          }
          done(error)
        })
      },
      function (done) {
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
        var deactivate = {active: false}
        runParallel([
          function deactivateProduct (done) {
            service.stripe.api.products.update(
              stripeData.product, deactivate, done
            )
          },
          function deactivateSKUs (done) {
            runParallel(
              stripeData.skus.map(function (sku) {
                return function deactivateSKU (done) {
                  service.stripe.api.skus.update(
                    sku.id, deactivate, done
                  )
                }
              }),
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
