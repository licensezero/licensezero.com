var ecb = require('ecb')
var fs = require('fs')
var licensorPath = require('../paths/licensor')
var parseJSON = require('json-parse-errback')
var productPath = require('../paths/product')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')

module.exports = function (service, product, callback) {
  var productData
  var licensorData
  runSeries([
    function readProductData (done) {
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
        parseJSON
      ], ecb(done, function (parsed) {
        productData = parsed
        done()
      }))
    },
    function (done) {
      runParallel([
        function readStripeData (done) {
          service.stripe.api.skus.retrieve(
            productData.stripe.skus[0].id,
            ecb(done, function (response) {
              productData.price = response.price
              productData.term = parseInt(response.attributes.term)
              done()
            })
          )
        },
        function readLicensorData (done) {
          var file = licensorPath(service, productData.id)
          runWaterfall([
            fs.readFile.bind(fs, file),
            parseJSON
          ], ecb(done, function (parsed) {
            licensorData = parsed
            done()
          }))
        }
      ], done)
    }
  ], ecb(callback, function () {
    callback(null, productData.retracted
      ? {
        product: product,
        retracted: true
      }
      : {
        product: product,
        price: productData.price,
        term: productData.term,
        grace: productData.grace,
        jurisdictions: productData.jurisdictions,
        repository: productData.repository,
        licensor: {
          id: licensorData.id,
          name: licensorData.name,
          jurisdiction: licensorData.jurisdiction
        }
      }
    )
  }))
}
