var annotateENOENT = require('../../data/annotate-enoent')
var mutateJSONFile = require('../../data/mutate-json-file')
var mutateTextFile = require('../../data/mutate-text-file')
var parseProducts = require('../../data/parse-products')
var productPath = require('../../paths/product')
var productsListPath = require('../../paths/products-list')
var runSeries = require('run-series')
var stringifyProducts = require('../../data/stringify-products')

exports.schema = {
  properties: {
    licensorID: require('./offer').schema.properties.licensorID,
    password: {
      type: 'string'
    },
    productID: require('./product').schema.properties.productID
  }
}

exports.handler = function (body, service, end, fail, lock) {
  var licensorID = body.licensorID
  var productID = body.productID
  lock([licensorID, productID], function (release) {
    runSeries([
      function markRetracted (done) {
        var file = productPath(service, productID)
        mutateJSONFile(file, function (data) {
          data.retracted = true
        }, annotateENOENT('no such product', done))
      },
      function removeFromProductsList (done) {
        var file = productsListPath(service, licensorID)
        mutateTextFile(file, function (text) {
          return stringifyProducts(
            parseProducts(text)
              .map(function (element) {
                if (
                  element.product === productID &&
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
