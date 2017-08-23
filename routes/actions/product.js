var UUIDV4 = require('../../data/uuidv4-pattern')
var ecb = require('ecb')
var fs = require('fs')
var licensorPath = require('../../paths/licensor')
var parseJSON = require('json-parse-errback')
var pick = require('../../data/pick')
var productPath = require('../../paths/product')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')
var without = require('../../data/without')

exports.schema = {
  properties: {
    product: {
      description: 'product id',
      type: 'string',
      pattern: UUIDV4
    }
  }
}

exports.handler = function (body, service, end, fail) {
  var productData
  var licensorData
  runSeries([
    function readProductFile (done) {
      runWaterfall([
        function readFile (done) {
          var file = productPath(service, body.product)
          fs.readFile(file, function (error, buffer) {
            if (error && error.code === 'ENOENT') {
              error.userMessage = 'no such product'
            }
            done(error, buffer)
          })
        },
        parseJSON,
        function (data, done) {
          productData = data
          done()
        }
      ], done)
    },
    function (done) {
      runParallel([
        function readLicensorFile (done) {
          var file = licensorPath(service, productData.id)
          fs.readFile(file, ecb(done, function (read) {
            parseJSON(read, ecb(done, function (parsed) {
              licensorData = parsed
              done()
            }))
          }))
        },
        function readStripeData (done) {
          service.stripe.api.skus.retrieve(
            productData.stripe.skus[0].id,
            ecb(done, function (response) {
              productData.price = response.price
              productData.term = parseInt(response.attributes.term)
              done()
            })
          )
        }
      ], done)
    }
  ], function (error) {
    if (error) {
      service.log.error(error)
      /* istanbul ignore else */
      if (error.userMessage) {
        fail(error.userMessage)
      } else {
        fail('internal error')
      }
    } else {
      var data = without(productData, ['id', 'stripe'])
      data.licensor = pick(licensorData, [
        'name', 'email', 'jurisdiction'
      ])
      end(data)
    }
  })
}
