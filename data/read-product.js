var ecb = require('ecb')
var fs = require('fs')
var licensorPath = require('../paths/licensor')
var parseJSON = require('json-parse-errback')
var productPath = require('../paths/product')
var runWaterfall = require('run-waterfall')

module.exports = function (service, productID, callback) {
  runWaterfall([
    function readProductData (done) {
      runWaterfall([
        fs.readFile.bind(fs, productPath(service, productID)),
        parseJSON
      ], function (error, parsed) {
        if (error && error.code === 'ENOENT') {
          error.userMessage = 'no such product'
        }
        done(error, parsed)
      })
    },
    function readLicensorData (product, done) {
      var file = licensorPath(service, product.licensor)
      runWaterfall([
        fs.readFile.bind(fs, file),
        parseJSON
      ], ecb(done, function (licensor) {
        licensor.id = product.licensor
        done(null, {
          licensor: licensor,
          product: product
        })
      }))
    }
  ], ecb(callback, function (results) {
    callback(null, Object.assign(results.product, {
      licensor: results.licensor
    }))
  }))
}
