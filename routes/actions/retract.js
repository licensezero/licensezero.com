var UUIDV4 = require('../../data/uuidv4-pattern')
var fs = require('fs')
var mutateJSONFile = require('../../data/mutate-json-file')
var mutateTextFile = require('../../data/mutate-text-file')
var parseProducts = require('../../data/parse-products')
var productPath = require('../../paths/product')
var productsListPath = require('../../paths/products-list')
var runSeries = require('run-series')
var stringifyProducts = require('../../data/stringify-products')

exports.schema = {
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
  }
}

exports.handler = function (body, service, end, fail, lock) {
  var product = body.product
  var id = body.id
  var file = productPath(service, product)
  lock([product, id], function (release) {
    runSeries([
      function checkExistence (done) {
        fs.readFile(file, function (error, buffer) {
          if (error && error.code === 'ENOENT') {
            error.userMessage = 'no such product'
          }
          done(error, buffer)
        })
      },
      function (done) {
        mutateJSONFile(file, function (data) {
          data.retracted = true
        }, done)
      },
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
